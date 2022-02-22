import _ from 'lodash'

import earthFromSpace from '../images/earth-from-space.jpg'
import testImage1 from '../images/test-image-1.jpg'
import testImage2 from '../images/test-image-2.jpg'

const imageFactory = (id, url, width, height) => {
    return { id, url, width, height }
}

const imageLibrary = _.keyBy(
    [
        imageFactory('Earth from space', earthFromSpace, 600, 375),
        imageFactory('test2', testImage2, 600, 600),
        imageFactory('test3', testImage1, 600, 600),
        imageFactory('test4', testImage2, 600, 600),
        imageFactory('test5', testImage1, 600, 600),
        imageFactory('test6', testImage2, 600, 600),
        imageFactory('test7', testImage1, 600, 600),
        imageFactory('test8', testImage2, 600, 600),
        imageFactory('test9', testImage1, 600, 600),
        imageFactory('test10', testImage2, 600, 600),
        imageFactory('test11', testImage1, 600, 600),
        imageFactory('test12', testImage2, 600, 600),
    ],
    'id'
)

export default imageLibrary
