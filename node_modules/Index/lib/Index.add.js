var Index = require('./Index.js');

// Add new data to the index
Index.prototype.add = function(data) {

  if (typeof data == 'object')

    // If data is an array, save each element of data
    if (data instanceof Array)
      for (var i = 0; i < data.length; i++)
        this.add(data[i]);
    // If data is an object, save data
    else {
      if (data.tags)
        // add new tags
        for (var i = 0; i < data.tags.length; i++) {
          this.tags[data.tags[i]] = true;
        }

      // save data
      this.collection.save(data);
    }
  // If data is not an object, throw an error
  else
    throw new Error('data must be an object or an array of objects');

};
