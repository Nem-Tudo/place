/**
 * @param {import("express").Request} req 
 * @param {import("express").Response} res 
 * @param {import("express").NextFunction} next 
 * @param {Array} values
 */
 module.exports = values => async (req, res, next) => {
    const body = req.body;

    if (!values.length) return next();

    if (!body) return res.status(400).send({ message: "400: Missing body" });

    for (const value of values) {
        if (res.headersSent) return;
        verifyValue(value, body)
    }

    function verifyValue(value, object, path = "") {
        if (value.type === "string") {

            if (typeof object[value.name] === "undefined") {

                if (value.required) return res.status(400).send({ message: `400: Parameter ${path}${value.name} is required` });

                return;
            }

            if (typeof object[value.name] !== "string") return res.status(400).send({ message: `400: Parameter ${path}${value.name} must be a string` });

            if (value.options) {

                if (value.options.noEmpty && object[value.name] === "") return res.status(400).send({ message: `400: Parameter ${path}${value.name} must not be empty` });

                if (value.options.values?.length && !value.options.values.includes(object[value.name])) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must be one of the following: ${value.options.values.join(", ")}` });

                if (value.options.min && object[value.name].length < value.options.min) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must have at least ${value.options.min} characters` });

                if (value.options.max && object[value.name].length > value.options.max) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must have at most ${value.options.max} characters` });
            }

        }

        if (value.type === "number") {

            if (typeof object[value.name] === "undefined") {

                if (value.required) return res.status(400).send({ message: `400: Parameter ${path}${value.name} is required` });

                return;
            }

            if (typeof object[value.name] !== "number") return res.status(400).send({ message: `400: Parameter ${path}${value.name} must be a number` });

            if (value.options) {

                if (value.options.noEmpty && object[value.name] === 0) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must not be 0` });

                if (typeof value.options.min != "undefined" && object[value.name] < value.options.min) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must be greater than ${value.options.min}` });

                if (typeof value.options.max != "undefined" && object[value.name] > value.options.max) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must be less than ${value.options.max}` });
            }

        }

        if (value.type === "boolean") {

            if (typeof object[value.name] === "undefined") {

                if (value.required) return res.status(400).send({ message: `400: Parameter ${path}${value.name} is required` });

                return;
            }

            if (typeof object[value.name] !== "boolean") return res.status(400).send({ message: `400: Parameter ${path}${value.name} must be a boolean` });
        }

        if (value.type === "array") {

            if (typeof object[value.name] === "undefined") {

                if (value.required) return res.status(400).send({ message: `400: Parameter ${path}${value.name} is required` });

                return;
            }

            if (!Array.isArray(object[value.name])) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must be an array` });

            if (value.options) {

                if (value.options.noEmpty && object[value.name].length === 0) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must not be empty` });

                if (value.options.min && object[value.name].length < value.options.min) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must have at least ${value.options.min} elements` });

                if (value.options.max && object[value.name].length > value.options.max) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must have at most ${value.options.max} elements` });

                if (value.options.elementsType?.length) {

                    value.options.elementsType.forEach(elementType => {
                        if(typeof elementType === "string"){
                            if(!object[value.name].every(element => typeof element === elementType)) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must have elements of type ${value.options.elementsType.join(", ")}` });
                        
                        } else if (typeof elementType === "object"){
                            console.log(elementType)
                            if(!object[value.name].every(element => verifyValue(elementType, element, `${path}${value.name}[${object[value.name].indexOf(element)}]`))) return;
                        }
                    })

                    // for (const element of object[value.name]) {

                    //     if (!value.options.elementsType.includes(typeof element)) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must have elements of type ${value.options.elementsType.join(", ")}` });
                    // }
                }
            }
        }

        if (value.type === "object") {

            if (typeof object[value.name] === "undefined") {

                if (value.required) return res.status(400).send({ message: `400: Parameter ${path}${value.name} is required` });

                return;
            }

            if (typeof object[value.name] !== "object" || Array.isArray(object[value.name]) || object[value.name] === null) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must be an object` });

            if (value.options) {

                if (value.options.noEmpty && Object.keys(object[value.name]).length === 0) return res.status(400).send({ message: `400: Parameter ${path}${value.name} must not be empty` });

                if(value.options.onlyKeys && Object.keys(object[value.name]).some(key => !value.options.keys.find(keyobj => keyobj.name === key))) return res.status(400).send({ message: `400: Parameter ${path}${value.name} cannot have a key called ${Object.keys(object[value.name]).find(key => !value.options.keys.find(keyobj => keyobj.name === key))}` });

                if (value.options.keys?.length) {

                    for (const key of value.options.keys) {
                        if (res.headersSent) return;
                        verifyValue(key, object[value.name], `${path}${value.name}.`)
                    }
                }
            }

        }
    }

    if (res.headersSent) return;
    return next()
}