module.exports = (function () {
    function _Class() {}

    _Class.prototype.findByEAN = function findByEAN(product, EAN) {
        for (var i = 0; i < product.length; i++) {
            if (product[i].EAN === EAN) {
                return product[i];
            }
        }
        return 0;
    }
    
    return _Class;
})();
