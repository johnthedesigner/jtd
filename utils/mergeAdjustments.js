import _ from 'lodash'

var getAllPaths = (obj, stack = []) => {
    return _.reduce(
        obj,
        (paths, value, key) => {
            return paths.concat(
                _.isObject(value)
                    ? getAllPaths(value, stack.concat(key))
                    : [stack.concat(key)]
            )
        },
        []
    )
}

var getValueAtPath = (path, obj) =>
    _.isObject(obj) ? getValueAtPath(_.tail(path), obj[_.head(path)]) : obj

var valueExistsAtPath = (path, obj) => {
    if (_.isEmpty(path)) {
        return true
    } else if (_.isObject(obj)) {
        return valueExistsAtPath(_.tail(path), obj[_.head(path)])
    } else {
        return false
    }
}

var buildFromPath = (path, val) =>
    _.isEmpty(path) ? val : { [_.head(path)]: buildFromPath(_.tail(path), val) }

export const mergeAdjustments = (array) => {
    const adjustmentsArray = _.map(array, (layer) => {
        return layer.adjustments
    })
    if (adjustmentsArray.length > 0) {
        const first = _.head(adjustmentsArray)

        const commonPaths = getAllPaths(first).filter((path) => {
            const value = getValueAtPath(path, first)

            return _.tail(adjustmentsArray).every((obj) => {
                return (
                    valueExistsAtPath(path, obj.adjustments) &&
                    getValueAtPath(path, obj.adjustments) === value
                )
            })
        })

        return _.reduce(
            commonPaths,
            (commons, path) => {
                _.merge(
                    commons,
                    buildFromPath(
                        path,
                        getValueAtPath(path, _.head(adjustmentsArray))
                    )
                )
                return commons
            },
            {}
        )
    }
}
