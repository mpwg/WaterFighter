#!/usr/bin/env python3
"""Render a synthetic solver diagnostic from dam-opening-field.ts output."""
import json
import numpy as np
import matplotlib
matplotlib.use('Agg')
import matplotlib.pyplot as plt
from matplotlib.colors import Normalize

with open('/tmp/waterfighter-dam-opening.json') as f: data=json.load(f)
w,h,c=data['width'],data['height'],data['cellSize']
fig,axes=plt.subplots(1,len(data['states']),figsize=(13,3.7),layout='constrained',sharex=True,sharey=True)
for ax,state in zip(axes,data['states']):
    depth=np.array(state['depth'],dtype=float).reshape(h,w);qx=np.array(state['qx'],dtype=float).reshape(h,w);qy=np.array(state['qy'],dtype=float).reshape(h,w)
    im=ax.imshow(depth,origin='upper',extent=[0,w*c,h*c,0],cmap='Blues',norm=Normalize(0,2),interpolation='nearest')
    ax.plot([60,60],[0,40],color='#aa4a28',linewidth=2);ax.plot([60,60],[44,h*c],color='#aa4a28',linewidth=2)
    y,x=np.mgrid[2:h:4,2:w:4];local=depth[y,x];u=np.divide(qx[y,x],local,out=np.zeros_like(local),where=local>1e-6);v=np.divide(qy[y,x],local,out=np.zeros_like(local),where=local>1e-6)
    ax.quiver((x+.5)*c,(y+.5)*c,u,v,angles='xy',scale_units='xy',scale=.3,color='#bc4a25',width=.006)
    ax.set_title(f"t = {state['time']:.0f} s");ax.set_xlabel('x [m]');ax.set_xlim(0,w*c);ax.set_ylim(h*c,0);ax.set_aspect('equal')
axes[0].set_ylabel('y [m]');fig.suptitle('Synthetische Dammöffnung – Tiefe und Fließrichtung')
fig.colorbar(im,ax=axes,label='Wassertiefe [m]',shrink=.78)
fig.savefig('docs/dam-opening-test.png',dpi=160);plt.close(fig)
