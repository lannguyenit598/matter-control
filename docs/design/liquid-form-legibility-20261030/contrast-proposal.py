from pathlib import Path
import re,math,json,sys
css=Path(__file__).with_name('proposal.css').read_text()
base=dict(re.findall(r"(--[\w-]+):\s*([^;]+);",css.split(":root {",1)[1].split("\n}",1)[0]))
dark=dict(re.findall(r"(--[\w-]+):\s*([^;]+);",css.split("[data-theme='dark'] {",1)[1].split("\n}",1)[0]))
def color(v,t):
 if v.startswith('var('):return color(t[v[4:-1]],t)
 if v.startswith('#'):return [int(v[i:i+2],16)/255 for i in (1,3,5)]+[1]
 m=re.fullmatch(r'oklch\(([^)]+)\)',v)
 if not m:raise ValueError(v)
 parts=m[1].split('/');L,C,h=map(float,parts[0].split());h=math.radians(h);a=C*math.cos(h);b=C*math.sin(h)
 l=(L+.3963377774*a+.2158037573*b)**3;m=(L-.1055613458*a-.0638541728*b)**3;s=(L-.0894841775*a-1.291485548*b)**3
 rgb=[4.0767416621*l-3.3077115913*m+.2309699292*s,-1.2684380046*l+2.6097574011*m-.3413193965*s,-.0041960863*l-.7034186147*m+1.707614701*s]
 def srgb(x):return max(0,min(1,12.92*x if x<=.0031308 else 1.055*x**(1/2.4)-.055))
 return list(map(srgb,rgb))+[float(parts[1]) if len(parts)>1 else 1]
def over(a,b):return [a[i]*a[3]+b[i]*(1-a[3]) for i in range(3)]+[1]
def lum(c):return sum(w*(x/12.92 if x<=.04045 else ((x+.055)/1.055)**2.4) for w,x in zip([.2126,.7152,.0722],c))
def ratio(a,b):
 x,y=sorted([lum(a),lum(b)]);return (y+.05)/(x+.05)
assert abs(ratio([0,0,0],[1,1,1])-21)<.001
assert max(color('oklch(0 0 0)',{}))==1
assert all(abs(x-1)<.001 for x in color('oklch(1 0 0)',{}))
rows=[]
for mode,t in [('light',base),('dark',base|dark)]:
 c=lambda n:color(t['--'+n],t)
 for behind in [[0,0,0,1],[1,1,1,1]]:
  pane=over(c('popover')[:3]+[c('popover')[3]*.84],behind)
  field=over(c('field-face'),pane)
  hover=over(c('field-hover'),pane)
  for text,bg,name,minimum in [(c('foreground'),pane,'body/pane',4.5),(c('dialog-muted'),pane,'description/pane',4.5),(c('foreground'),field,'input/field',4.5),(c('dialog-muted'),field,'placeholder/field',4.5),(c('dialog-muted'),hover,'placeholder/hover',4.5),(c('input'),field,'field border',3),(c('ring'),field,'focus/field',3)]:
   value=ratio(text,bg);rows.append(dict(mode=mode,backdrop='black' if behind[0]==0 else 'white',pair=name,ratio=round(value,3),minimum=minimum,pass_=value>=minimum))
print(json.dumps(rows,indent=2))
raise SystemExit(1 if any(not r['pass_'] for r in rows) else 0)
