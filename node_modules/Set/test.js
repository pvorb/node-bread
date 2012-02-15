var Set = require('./set.js');

var alpha = new Set([ 'a', 'b', 'c' ]);

console.log(alpha.size());

console.log(alpha.toString());

alpha.add('d');

console.log(alpha.toString());

alpha.add('e', 'f', 'g');

console.log(alpha.toString());

alpha.remove('f', 'b');

console.log(alpha.toString());

console.log(alpha.size());

console.log(alpha.contains('a'));

console.log(alpha.contains('f'));

console.log(alpha.toArray());
