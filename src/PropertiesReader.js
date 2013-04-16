(function() {

   "use strict";

   var fs = require('fs');

   /**
    *
    * @param {String} sourceFile
    * @constructor
    * @name {PropertiesReader}
    */
   function PropertiesReader(sourceFile) {
      this._properties = {};
      this._propertiesExpanded = {};
      sourceFile && this.read(fs.readFileSync(sourceFile, 'utf-8'));
   }

   /**
    * @type {String} The name of a section that should be prefixed on an property as it is added
    * @ignore
    */
   PropertiesReader.prototype._section = '';

   /**
    * Gets the number of properties that have been read into this PropertiesReader.
    *
    * @name PropertiesReader#length
    * @type {Number}
    */
   Object.defineProperty(PropertiesReader.prototype, 'length', {
      configurable: false,
      get: function() {
         return Object.keys(this._properties).length;
      },
      set: function() {
         throw new Error("Cannot set length of PropertiesReader properties");
      }
   });

   /**
    * Reads any string input into the PropertiesReader
    *
    * @param {String} input
    * @return {PropertiesReader} this instance
    */
   PropertiesReader.prototype.read = function(input) {
      delete this._section;
      ('' + input).split('\n').forEach(this._readLine, this);
      return this;
   };

   /**
    * Used as a processor for the array of input lines when reading from a source file
    * @param {String} propertyString
    */
   PropertiesReader.prototype._readLine = function(propertyString) {
      if(!!(propertyString = propertyString.trim())) {
         var section = /^\[([a-zA-Z0-9]+)\]$/.exec(propertyString);
         var property = !section && /^([^=]+)(={0,1})(.*)$/.exec(propertyString);

         if(section) {
            this._section = section[1];
         }
         else if(property) {
            section = this._section ? this._section + '.' : '';
            this.set(section + property[1].trim(), property[3].trim());
         }
      }
   };

   /**
    * Calls the supplied function for each property
    *
    * @param {Function} fn
    * @param {Object} scope
    * @return {PropertiesReader}
    */
   PropertiesReader.prototype.each = function(fn, scope) {
      for(var key in this._properties) {
         fn.call(scope, key, this._properties[key]);
      }
      return this;
   };

   /**
    * Gets a single property value based on the full string key. When the property is not found in the PropertiesReader,
    * the return value will be null.
    *
    * @param {String} key
    * @return {*}
    */
   PropertiesReader.prototype.get = function(key) {
      return this._properties.hasOwnProperty(key) ? this._properties[key] : null;
   };

   /**
    * Sets the supplied key in the properties store with the supplied value, the value can be any string representation
    * that would be valid in a properties file (eg: true and false or numbers are converted to their real values).
    *
    * @param {String} key
    * @param {String} value
    * @return {PropertiesReader}
    */
   PropertiesReader.prototype.set = function(key, value) {
      var parsedValue;
      if(!isNaN(value)) {
         parsedValue = +value;
      }
      else if(value == 'true' || value == 'false') {
         parsedValue = (value == 'true');
      }
      else {
         parsedValue = ('' + value).trim();
      }

      this._properties[key] = parsedValue;

      var expanded = key.split('.');
      var source = this._propertiesExpanded;
      while(expanded.length > 1) {
         var step = expanded.shift();
         source = (source[step] = source[step] || {});
      }
      source[expanded[0]] = parsedValue;

      return this;
   };

   /**
    * Gets the object that represents the exploded properties.
    *
    * Note that this object is currently mutable without the option to persist or interrogate changes.
    *
    * @return {*}
    */
   PropertiesReader.prototype.path = function() {
      return this._propertiesExpanded;
   };

   /**
    * Creates and returns a new PropertiesReader based on the values in this instance.
    * @return {PropertiesReader}
    */
   PropertiesReader.prototype.clone = function() {
      var propertiesReader = new PropertiesReader(null);
      this.each(propertiesReader.set, propertiesReader);

      return propertiesReader;
   };


   PropertiesReader.builder = function(sourceFile) {
      return new PropertiesReader(sourceFile);
   };

   module.exports = PropertiesReader.builder;
}());