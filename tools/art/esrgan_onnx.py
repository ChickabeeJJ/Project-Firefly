"""Build an ONNX Real-ESRGAN (RRDBNet) from a .pth checkpoint without PyTorch, and upscale images.

usage:
  python3 tools/art/esrgan_onnx.py build <weights.pth> <out.onnx>
  python3 tools/art/esrgan_onnx.py run <model.onnx> <in.png> <out.png> [scale=4] [tile=256]
The .pth zip is unpickled by hand (tensors rebuilt from raw storages). Alpha is upscaled with
Lanczos and recombined, so transparent character renders keep their cut-outs.
"""
import sys, zipfile, pickle, numpy as np

def load_pth(path):
    z = zipfile.ZipFile(path); root = z.namelist()[0].split('/')[0]
    class Storage:
        def __init__(self, dtype, key): self.dtype, self.key = dtype, key
    def rebuild(storage, offset, size, stride, *a):
        buf = np.frombuffer(z.read(f'{root}/data/{storage.key}'), dtype=storage.dtype)
        n = int(np.prod(size)) if size else 1
        return np.lib.stride_tricks.as_strided(buf[offset:], shape=size, strides=[s * buf.itemsize for s in stride]).copy() if n else np.zeros(size, storage.dtype)
    class U(pickle.Unpickler):
        def find_class(self, mod, name):
            if name == '_rebuild_tensor_v2': return rebuild
            if name.endswith('Storage'): return {'FloatStorage': np.float32, 'HalfStorage': np.float16}.get(name, np.float32)
            if mod == 'collections' and name == 'OrderedDict':
                import collections; return collections.OrderedDict
            return super().find_class(mod, name)
        def persistent_load(self, pid):
            _, dtype, key, *_ = pid
            return Storage(dtype, key)
    d = U(z.open(f'{root}/data.pkl')).load()
    for k in ('params_ema', 'params'):
        if k in d: d = d[k]; break
    return {k: v.astype(np.float32) for k, v in d.items()}

def build(pth, out):
    import onnx
    from onnx import helper, TensorProto, numpy_helper
    W = load_pth(pth)
    nb = 1 + max(int(k.split('.')[1]) for k in W if k.startswith('body.'))
    nodes, inits = [], []
    cnt = [0]
    def name(p): cnt[0] += 1; return f'{p}{cnt[0]}'
    def conv(x, key, act=False):
        w, b = W[key + '.weight'], W[key + '.bias']
        inits.append(numpy_helper.from_array(w, key + '.weight')); inits.append(numpy_helper.from_array(b, key + '.bias'))
        y = name('c'); nodes.append(helper.make_node('Conv', [x, key + '.weight', key + '.bias'], [y], pads=[1, 1, 1, 1]))
        if act:
            z = name('a'); nodes.append(helper.make_node('LeakyRelu', [y], [z], alpha=0.2)); return z
        return y
    def concat(xs): y = name('cat'); nodes.append(helper.make_node('Concat', xs, [y], axis=1)); return y
    def scale_add(x, base, s):
        k = name('s'); inits.append(numpy_helper.from_array(np.array(s, np.float32), k))
        m = name('m'); nodes.append(helper.make_node('Mul', [x, k], [m]))
        y = name('add'); nodes.append(helper.make_node('Add', [m, base], [y])); return y
    def rdb(x, p):
        x1 = conv(x, p + '.conv1', True); x2 = conv(concat([x, x1]), p + '.conv2', True)
        x3 = conv(concat([x, x1, x2]), p + '.conv3', True); x4 = conv(concat([x, x1, x2, x3]), p + '.conv4', True)
        x5 = conv(concat([x, x1, x2, x3, x4]), p + '.conv5'); return scale_add(x5, x, 0.2)
    def up(x):
        sc = name('sc'); inits.append(numpy_helper.from_array(np.array([1, 1, 2, 2], np.float32), sc))
        y = name('up'); nodes.append(helper.make_node('Resize', [x, '', sc], [y], mode='nearest')); return y
    feat = conv('input', 'conv_first')
    b = feat
    for i in range(nb):
        r = b
        for j in (1, 2, 3): r = rdb(r, f'body.{i}.rdb{j}')
        b = scale_add(r, b, 0.2)
    body = conv(b, 'conv_body')
    s = name('add'); nodes.append(helper.make_node('Add', [feat, body], [s]))
    f = conv(up(s), 'conv_up1', True); f = conv(up(f), 'conv_up2', True)
    f = conv(f, 'conv_hr', True); out_t = conv(f, 'conv_last')
    nodes.append(helper.make_node('Identity', [out_t], ['output']))
    g = helper.make_graph(nodes, 'rrdb', [helper.make_tensor_value_info('input', TensorProto.FLOAT, [1, 3, None, None])],
                          [helper.make_tensor_value_info('output', TensorProto.FLOAT, [1, 3, None, None])], inits)
    m = helper.make_model(g, opset_imports=[helper.make_opsetid('', 13)]); m.ir_version = 8
    onnx.save(m, out); print('built', nb, 'blocks')

def run(model, src, dst, scale=4, tile=256, pad=12):
    import onnxruntime as ort
    from PIL import Image
    so = ort.SessionOptions(); so.intra_op_num_threads = 4
    sess = ort.InferenceSession(model, so, providers=['CPUExecutionProvider'])
    im = Image.open(src).convert('RGBA'); a = np.array(im).astype(np.float32) / 255
    rgb = a[..., :3].transpose(2, 0, 1)[None]
    H, Wd = rgb.shape[2:]; out = np.zeros((3, H * scale, Wd * scale), np.float32)
    for y in range(0, H, tile):
        for x in range(0, Wd, tile):
            y0, x0 = max(0, y - pad), max(0, x - pad); y1, x1 = min(H, y + tile + pad), min(Wd, x + tile + pad)
            o = sess.run(None, {'input': np.ascontiguousarray(rgb[:, :, y0:y1, x0:x1])})[0][0]
            oy, ox = (y - y0) * scale, (x - x0) * scale
            th, tw = min(tile, H - y) * scale, min(tile, Wd - x) * scale
            out[:, y * scale:y * scale + th, x * scale:x * scale + tw] = o[:, oy:oy + th, ox:ox + tw]
        print(f'{y}/{H}', flush=True)
    rgb8 = (np.clip(out.transpose(1, 2, 0), 0, 1) * 255).round().astype(np.uint8)
    alpha = im.split()[3].resize((Wd * scale, H * scale), Image.LANCZOS)
    res = Image.fromarray(rgb8, 'RGB').convert('RGBA'); res.putalpha(alpha); res.save(dst); print('saved', res.size)

if __name__ == '__main__':
    if sys.argv[1] == 'build': build(sys.argv[2], sys.argv[3])
    else: run(sys.argv[2], sys.argv[3], sys.argv[4], *(int(v) for v in sys.argv[5:]))
