
(function(){
 
    function $elC(el) { this.el = el; return this; }
    function $el(str) {
        document.getElementById(str);
        return new $elC(el); 
      }

    $elC.prototype = {
            html : function(data) { this.el.innerHTML = data; return this; },
            hide        : function() {  this.el.style.display="none";  return this;  },
            show : function() {  this.el[i].style.display="block";  return this;  }
          };
 
    window.$el = $el;

})();