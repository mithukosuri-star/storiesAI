import * as T from 'three'
function crescentShape() {
  const R1 = 1, R2 = 0.96, d = 0.32
  const x = (R2 * R2 - R1 * R1 - d * d) / (2 * d)
  const y = Math.sqrt(Math.max(0, R1 * R1 - x * x))
  const th = Math.atan2(y, x)
  const a1 = Math.atan2(y, x + d)
  const steps = 90
  const shape = new T.Shape()
  shape.moveTo(Math.cos(-th) * R1, Math.sin(-th) * R1)
  for (let i = 1; i <= steps; i++) { const a = -th + 2 * th * (i / steps); shape.lineTo(Math.cos(a) * R1, Math.sin(a) * R1) }
  for (let i = 1; i <= steps; i++) { const a = a1 - 2 * a1 * (i / steps); shape.lineTo(Math.cos(a) * R2 - d, Math.sin(a) * R2) }
  shape.closePath()
  return shape
}
const shape = crescentShape()
const pts = shape.getPoints()
console.log('shape points:', pts.length, 'first', pts[0].x.toFixed(3), pts[0].y.toFixed(3))
const area = Math.abs(T.ShapeUtils.area(pts))
console.log('shape area:', area.toFixed(3), '(expect ~0.7-1.2 for a crescent)')
const geo = new T.ExtrudeGeometry(shape, { depth: 0.2, bevelEnabled: true, bevelThickness: 0.035, bevelSize: 0.028, bevelSegments: 2, curveSegments: 96 })
geo.center()
geo.computeBoundingBox()
const bb = geo.boundingBox
console.log('geometry verts:', geo.attributes.position.count)
console.log('bbox:', bb.min.x.toFixed(2), bb.min.y.toFixed(2), bb.min.z.toFixed(2), '→', bb.max.x.toFixed(2), bb.max.y.toFixed(2), bb.max.z.toFixed(2))
const size = new T.Vector3(); bb.getSize(size)
console.log('size:', size.x.toFixed(2), size.y.toFixed(2), size.z.toFixed(2))
if (size.x < 0.9 || size.y < 1.5) { console.error('CRESCENT LOOKS WRONG'); process.exit(1) }
console.log('crescent OK')
