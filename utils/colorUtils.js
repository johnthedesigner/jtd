export const colorsWithFallback = (solid, gradient) => {
    if (!solid && gradient) solid = gradient.start

    if (!gradient && solid)
        gradient = {
            angle: 0,
            start: solid,
            end: solid,
        }

    return {
        solid,
        gradient,
    }
}

export const palettes = {
    "blue": {
        "0": {
            "value": "#F8FBFF",
            "type": "color",
        },
        "1": {
            "value": "#E9F1FF",
            "type": "color",
        },
        "2": {
            "value": "#CFE1FF",
            "type": "color",
        },
        "3": {
            "value": "#B1CEFF",
            "type": "color",
        },
        "4": {
            "value": "#8DB9FF",
            "type": "color",
        },
        "5": {
            "value": "#69A4FF",
            "type": "color",
        },
        "6": {
            "value": "#4691FF",
            "type": "color",
        },
        "7": {
            "value": "#2781FF",
            "type": "color",
        },
        "8": {
            "value": "#0069F0",
            "type": "color",
        },
        "9": {
            "value": "#0060BF",
            "type": "color",
        },
        "10": {
            "value": "#005499",
            "type": "color",
        },
        "11": {
            "value": "#00487A",
            "type": "color",
        },
        "12": {
            "value": "#003A5C",
            "type": "color",
        },
        "13": {
            "value": "#002A40",
            "type": "color",
        },
        "14": {
            "value": "#001B26",
            "type": "color",
        },
        "15": {
            "value": "#001219",
            "type": "color",
        },
    },
    "caribbean-green": {
        "0": {
            "value": "#E8FFFA",
            "type": "color",
        },
        "1": {
            "value": "#ABFFEA",
            "type": "color",
        },
        "2": {
            "value": "#5CF9CE",
            "type": "color",
        },
        "3": {
            "value": "#30E5B1",
            "type": "color",
        },
        "4": {
            "value": "#0FD398",
            "type": "color",
        },
        "5": {
            "value": "#00BC7E",
            "type": "color",
        },
        "6": {
            "value": "#00A86C",
            "type": "color",
        },
        "7": {
            "value": "#00935B",
            "type": "color",
        },
        "8": {
            "value": "#00814D",
            "type": "color",
        },
        "9": {
            "value": "#00703F",
            "type": "color",
        },
        "10": {
            "value": "#006035",
            "type": "color",
        },
        "11": {
            "value": "#00512B",
            "type": "color",
        },
        "12": {
            "value": "#003F20",
            "type": "color",
        },
        "13": {
            "value": "#002D16",
            "type": "color",
        },
        "14": {
            "value": "#001B0D",
            "type": "color",
        },
        "15": {
            "value": "#001409",
            "type": "color",
        },
    },
    "orange": {
        "0": {
            "value": "#FFF8F4",
            "type": "color",
        },
        "1": {
            "value": "#FFEBE0",
            "type": "color",
        },
        "2": {
            "value": "#FFD6C1",
            "type": "color",
        },
        "3": {
            "value": "#FFBD9E",
            "type": "color",
        },
        "4": {
            "value": "#FFA075",
            "type": "color",
        },
        "5": {
            "value": "#FF824C",
            "type": "color",
        },
        "6": {
            "value": "#FF5E1E",
            "type": "color",
        },
        "7": {
            "value": "#F03F00",
            "type": "color",
        },
        "8": {
            "value": "#D63200",
            "type": "color",
        },
        "9": {
            "value": "#BD2500",
            "type": "color",
        },
        "10": {
            "value": "#A31B00",
            "type": "color",
        },
        "11": {
            "value": "#8C1300",
            "type": "color",
        },
        "12": {
            "value": "#700B00",
            "type": "color",
        },
        "13": {
            "value": "#540500",
            "type": "color",
        },
        "14": {
            "value": "#380100",
            "type": "color",
        },
        "15": {
            "value": "#2B0000",
            "type": "color",
        },
    },
    "black": {
        "0": {
            "value": "#F9F9F9",
            "type": "color",
        },
        "1": {
            "value": "#EFEFEF",
            "type": "color",
        },
        "2": {
            "value": "#E0E0E0",
            "type": "color",
        },
        "3": {
            "value": "#CBCBCB",
            "type": "color",
        },
        "4": {
            "value": "#B7B7B7",
            "type": "color",
        },
        "5": {
            "value": "#A5A5A5",
            "type": "color",
        },
        "6": {
            "value": "#919191",
            "type": "color",
        },
        "7": {
            "value": "#7F8081",
            "type": "color",
        },
        "8": {
            "value": "#6B7077",
            "type": "color",
        },
        "9": {
            "value": "#59616D",
            "type": "color",
        },
        "10": {
            "value": "#495463",
            "type": "color",
        },
        "11": {
            "value": "#3B4759",
            "type": "color",
        },
        "12": {
            "value": "#2B394C",
            "type": "color",
        },
        "13": {
            "value": "#18273A",
            "type": "color",
        },
        "14": {
            "value": "#0B1828",
            "type": "color",
        },
        "15": {
            "value": "#06111E",
            "type": "color",
        },
    },
    "purple-heart": {
        "0": {
            "value": "#FBF7FF",
            "type": "color",
        },
        "1": {
            "value": "#F7ECFF",
            "type": "color",
        },
        "2": {
            "value": "#EED8FF",
            "type": "color",
        },
        "3": {
            "value": "#E2BEFF",
            "type": "color",
        },
        "4": {
            "value": "#D6A5FF",
            "type": "color",
        },
        "5": {
            "value": "#C786FF",
            "type": "color",
        },
        "6": {
            "value": "#BA6DFF",
            "type": "color",
        },
        "7": {
            "value": "#AD53FF",
            "type": "color",
        },
        "8": {
            "value": "#A243FB",
            "type": "color",
        },
        "9": {
            "value": "#8A1AF6",
            "type": "color",
        },
        "10": {
            "value": "#6D00E2",
            "type": "color",
        },
        "11": {
            "value": "#5600C3",
            "type": "color",
        },
        "12": {
            "value": "#4100A2",
            "type": "color",
        },
        "13": {
            "value": "#2C007E",
            "type": "color",
        },
        "14": {
            "value": "#1A0055",
            "type": "color",
        },
        "15": {
            "value": "#120041",
            "type": "color",
        },
    },
    "robins-egg-blue": {
        "0": {
            "value": "#E8FFFF",
            "type": "color",
        },
        "1": {
            "value": "#A1FFFF",
            "type": "color",
        },
        "2": {
            "value": "#51F4EF",
            "type": "color",
        },
        "3": {
            "value": "#2BE2DB",
            "type": "color",
        },
        "4": {
            "value": "#0FD3C9",
            "type": "color",
        },
        "5": {
            "value": "#00B7A7",
            "type": "color",
        },
        "6": {
            "value": "#00A593",
            "type": "color",
        },
        "7": {
            "value": "#00917D",
            "type": "color",
        },
        "8": {
            "value": "#007F6A",
            "type": "color",
        },
        "9": {
            "value": "#00705B",
            "type": "color",
        },
        "10": {
            "value": "#00604D",
            "type": "color",
        },
        "11": {
            "value": "#004E3D",
            "type": "color",
        },
        "12": {
            "value": "#003F30",
            "type": "color",
        },
        "13": {
            "value": "#002D21",
            "type": "color",
        },
        "14": {
            "value": "#001B13",
            "type": "color",
        },
        "15": {
            "value": "#00140E",
            "type": "color",
        },
    },
    "sunglow": {
        "0": {
            "value": "#FFFAE6",
            "type": "color",
        },
        "1": {
            "value": "#FFEFB3",
            "type": "color",
        },
        "2": {
            "value": "#FFDD6B",
            "type": "color",
        },
        "3": {
            "value": "#FFBB00",
            "type": "color",
        },
        "4": {
            "value": "#F0AB00",
            "type": "color",
        },
        "5": {
            "value": "#DB9700",
            "type": "color",
        },
        "6": {
            "value": "#C78300",
            "type": "color",
        },
        "7": {
            "value": "#B57300",
            "type": "color",
        },
        "8": {
            "value": "#A16200",
            "type": "color",
        },
        "9": {
            "value": "#8F5400",
            "type": "color",
        },
        "10": {
            "value": "#7D4600",
            "type": "color",
        },
        "11": {
            "value": "#693800",
            "type": "color",
        },
        "12": {
            "value": "#572D00",
            "type": "color",
        },
        "13": {
            "value": "#401F00",
            "type": "color",
        },
        "14": {
            "value": "#291200",
            "type": "color",
        },
        "15": {
            "value": "#1C0C00",
            "type": "color",
        },
    },
    "almond": {
        "0": {
            "value": "#FEF8F2",
            "type": "color",
        },
        "1": {
            "value": "#F9EEE3",
            "type": "color",
        },
        "2": {
            "value": "#F4D5B7",
            "type": "color",
        },
        "3": {
            "value": "#F1C9A2",
            "type": "color",
        },
        "4": {
            "value": "#EAA565",
            "type": "color",
        },
        "5": {
            "value": "#E58D3E",
            "type": "color",
        },
        "6": {
            "value": "#E07619",
            "type": "color",
        },
        "7": {
            "value": "#D35F00",
            "type": "color",
        },
        "8": {
            "value": "#BC4F00",
            "type": "color",
        },
        "9": {
            "value": "#A74200",
            "type": "color",
        },
        "10": {
            "value": "#933600",
            "type": "color",
        },
        "11": {
            "value": "#7C2A00",
            "type": "color",
        },
        "12": {
            "value": "#651F00",
            "type": "color",
        },
        "13": {
            "value": "#4C1500",
            "type": "color",
        },
        "14": {
            "value": "#300B00",
            "type": "color",
        },
        "15": {
            "value": "#230800",
            "type": "color",
        },
    },
    "sunset-red": {
        "0": {
            "value": "#FFFAF9",
            "type": "color",
        },
        "1": {
            "value": "#FFECEA",
            "type": "color",
        },
        "2": {
            "value": "#FFD5D1",
            "type": "color",
        },
        "3": {
            "value": "#FFBDB7",
            "type": "color",
        },
        "4": {
            "value": "#FFA099",
            "type": "color",
        },
        "5": {
            "value": "#FF7D75",
            "type": "color",
        },
        "6": {
            "value": "#FE635B",
            "type": "color",
        },
        "7": {
            "value": "#F6261D",
            "type": "color",
        },
        "8": {
            "value": "#E20300",
            "type": "color",
        },
        "9": {
            "value": "#C60005",
            "type": "color",
        },
        "10": {
            "value": "#AC000A",
            "type": "color",
        },
        "11": {
            "value": "#90000E",
            "type": "color",
        },
        "12": {
            "value": "#74000F",
            "type": "color",
        },
        "13": {
            "value": "#56000F",
            "type": "color",
        },
        "14": {
            "value": "#3A000C",
            "type": "color",
        },
        "15": {
            "value": "#2A000A",
            "type": "color",
        },
    },
    "navy-blue": {
        "0": {
            "value": "#F9FBFF",
            "type": "color",
        },
        "1": {
            "value": "#EAF1FF",
            "type": "color",
        },
        "2": {
            "value": "#D0E0FF",
            "type": "color",
        },
        "3": {
            "value": "#B2CDFF",
            "type": "color",
        },
        "4": {
            "value": "#8EB8FF",
            "type": "color",
        },
        "5": {
            "value": "#6FA6FF",
            "type": "color",
        },
        "6": {
            "value": "#4E8FF6",
            "type": "color",
        },
        "7": {
            "value": "#3D83EE",
            "type": "color",
        },
        "8": {
            "value": "#166BE9",
            "type": "color",
        },
        "9": {
            "value": "#005BD2",
            "type": "color",
        },
        "10": {
            "value": "#0051A7",
            "type": "color",
        },
        "11": {
            "value": "#004683",
            "type": "color",
        },
        "12": {
            "value": "#003962",
            "type": "color",
        },
        "13": {
            "value": "#002A43",
            "type": "color",
        },
        "14": {
            "value": "#001A27",
            "type": "color",
        },
        "15": {
            "value": "#00121A",
            "type": "color",
        },
    },
    "magenta": {
        "0": {
            "value": "#FFF6FC",
            "type": "color",
        },
        "1": {
            "value": "#FFE7F7",
            "type": "color",
        },
        "2": {
            "value": "#FFD2F0",
            "type": "color",
        },
        "3": {
            "value": "#FFB4E7",
            "type": "color",
        },
        "4": {
            "value": "#FF95DE",
            "type": "color",
        },
        "5": {
            "value": "#FE7BD6",
            "type": "color",
        },
        "6": {
            "value": "#F951C7",
            "type": "color",
        },
        "7": {
            "value": "#F114B1",
            "type": "color",
        },
        "8": {
            "value": "#D3009E",
            "type": "color",
        },
        "9": {
            "value": "#B70090",
            "type": "color",
        },
        "10": {
            "value": "#9D0081",
            "type": "color",
        },
        "11": {
            "value": "#840070",
            "type": "color",
        },
        "12": {
            "value": "#68005C",
            "type": "color",
        },
        "13": {
            "value": "#4E0048",
            "type": "color",
        },
        "14": {
            "value": "#320030",
            "type": "color",
        },
        "15": {
            "value": "#250024",
            "type": "color",
        },
    },
}
