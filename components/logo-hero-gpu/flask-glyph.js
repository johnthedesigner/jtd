/**
 * Lucide's `flask-conical`, as filled outlines.
 *
 * The hero's field renders *filled* glyphs: `buildLogoSdf` flattens closed
 * M/L/C/Z outlines, scan-converts them with the nonzero winding rule, and
 * turns the mask into a distance field. Lucide ships a stroked icon with
 * elliptical arcs, so neither its curve types nor its fill model fit — it
 * had to be converted rather than pasted.
 *
 * Produced once, offline: the arcs were converted to cubics by the SVG
 * spec's endpoint-to-centre parameterisation, each subpath stroked at the
 * icon's own 2-unit width with round caps and joins, the three unioned, and
 * the result simplified and emitted as cubics. Three contours come out — the
 * flask's outer edge and the two enclosed areas the stroke leaves behind,
 * which the nonzero rule reads as holes.
 *
 * Icon: lucide-react 0.545.0, ISC licence.
 */

export const FLASK_VIEWBOX = { width: 24, height: 24 }

export const FLASK_PATHS = [
    'M18.5192 14.6944L20.6325 18.5604C21.1793 19.5599 21.1622 20.5497 20.581 21.53C19.9998 22.5103 19.1394 23.0003 17.9998 23L6 23C4.8605 23.0003 4.0002 22.5103 3.419 21.53C2.8378 20.5497 2.8207 19.5597 3.3677 18.56L5.4808 14.6944C5.5223 14.4869 5.6103 14.3259 5.7448 14.2115L8.8775 8.4804C8.9593 8.3308 9.0001 8.1709 9 8.0004L9 3L8.5 3C7.8333 3 7.5 2.6667 7.5 2C7.5 1.3333 7.8333 1 8.5 1L15.5 1C16.1667 1 16.5 1.3333 16.5 2C16.5 2.6667 16.1667 3 15.5 3L15 3L15 8C14.9999 8.1707 15.0408 8.3309 15.1225 8.4804L18.2552 14.2115C18.3897 14.3259 18.4777 14.4869 18.5192 14.6944Z',
    'M16.9536 16L7.0464 16L5.1223 19.52C4.9399 19.8532 4.9456 20.1832 5.1394 20.51C5.3331 20.8368 5.62 21.0001 6 21L18.0002 21C18.3801 21.0001 18.6669 20.8368 18.8606 20.51C19.0544 20.1832 19.06 19.8531 18.8775 19.5196L16.9536 16Z',
    'M13 3L11 3L11 7.9996C11.0002 8.5109 10.8777 8.9909 10.6325 9.4396L8.1396 14L15.8603 14L13.3675 9.4396C13.1223 8.9909 12.9998 8.511 13 8L13 3Z'
]
