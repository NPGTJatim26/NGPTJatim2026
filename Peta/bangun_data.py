"""Bangun data/d_simbol.js dan data/d_pantai.js (data tertanam, jalan tanpa server) dari data/sumber/.
Jalankan ulang bila file di data/sumber/ diganti:  python bangun_data.py"""
import base64
S, D = 'data/sumber/', 'data/'
b = lambda n: base64.b64encode(open(S + n, 'rb').read()).decode()
hdr = 'window.DATA=window.DATA||{};\n'
open(D + 'd_simbol.js', 'w').write(hdr + ''.join(f"DATA.{k}='{b(f)}';\n" for k, f in [('Simbol_semua', 'Simbol_semua.stylx'), ('RTR', 'RTR.stylx'), ('Toponim', 'Toponim.stylx')]))
open(D + 'd_pantai.js', 'w').write(hdr + 'DATA.pantai=' + open(S + 'garis_pantai.json').read() + ';\n')
print('selesai')
