/**
 * Created by pauloalexandreneves on 17/05/16.
 */

var contar = ( function(){
    var contador = 0;
    return function () {return contador += 1;}
})();

function closures(){
    var x = document.getElementById("text");
    x.innerHTML = contar();

}
