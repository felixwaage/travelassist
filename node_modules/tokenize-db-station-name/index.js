'use strict'

const normalize = require('normalize-for-search')

const delim = /[\s\/\(\)\-,\.\+]+/
const specialChars = /[^\w\s]|_/g

const replace = {
	'bay': 'bayern',
	'thuer': 'thueringen',
	'sachs': 'sachsen',
	'anh': 'anhalt',
	'westf': 'westfalen',
	'wuertt': 'wuerttemberg',
	'oberpf': 'oberpfalz',
	'schwab': 'schwaben',
	'oberbay': 'oberbayern',
	'holst': 'holstein',
	'braunschw': 'braunschweig',
	'saalkr': 'saalekreis',
	'saalkr': 'saalekreis',
	'niederbay': 'niederbayern',
	'schwarzw': 'schwarzwald',
	'oldb': 'oldenburg',
	'uckerm': 'uckermark',
	'rheinl': 'rheinland',
	'oberfr': 'oberfranken',
	'rheinhess': 'rheinhessen',
	'hess': 'hessen',
	'altm': 'altmark',
	'limes': 'limesstadt',
	'vogtl': 'vogtland',
	'meckl': 'mecklenburg',
	'mittelfr': 'mittelfranken',
	'dillkr': 'dillkreis',
	'odenw': 'odenwald',
	'erzgeb': 'erzgebirge',
	'weinstr': 'weinstrasse',
	'prign': 'prignitz',
	'oberhess': 'oberhessen',
	'ostfriesl': 'ostfriesland',
	'schlesw': 'schleswig',
	'saechs schweiz': 'saechsische',
	'unterfr': 'unterfranken',
	'westerw': 'westerwald',
	'dithm': 'dithmarschen',
	'thueringerw': 'thueringer wald',

	'ob': 'oben',
	'unt': 'unten',
	'bf': 'bahnhof',
	'hbf': 'hauptbahnhof'
}

const transforms = [
	(ts) => {
		const i = ts.indexOf('saechs')
		if (i >= 0 && ts[i + 1] === 'schweiz') ts[i] = 'saechsische'
	},
	(ts) => {
		const i = ts.indexOf('b')
		if (i >= 0 && ts[i + 1]) ts[i] = 'bei'
	}
]

const tokenize = (name) => {
	if ('string' !== typeof name) throw new Error('name must be a string')
	if (name.length === 0) return ''

	const ts = normalize(name)
	.split(delim)
	.map(t => t.trim())
	.filter(t => t.length > 0)
	.map((t) => {
		if (t in replace) return replace[t]
		return t
	})

	for (let t of transforms) t(ts)

	return ts
}

module.exports = tokenize
