$(function() {
  function htmlDecode(input){
    var e = document.createElement("div");
    e.innerHTML = input;
    return e.childNodes.length === 0 ? "" : e.childNodes[0].nodeValue;
  }
  var path = $("#path").html();
  var sessid = $("#sessid").html();
  var fileContents = htmlDecode($("#file").html()); 
  function waitForNow() {
    if (typeof now.register !== "undefined") {
      now.register(sessid, path);
      var editor = CodeMirror(document.getElementById("editor"), {
        mode: "haskell",
        lineNumbers: true,
        matchBrackets: true,
        value: fileContents,
        theme: "elegant"
      });
      var save = $("#save");
      var cl = $("#cl").focus();
      var clf = $("#clf");
      var clh = $("#clh");
      var clc = document.getElementById("console");
      save.click(function() {
        now.save(path, editor.getValue());
      });
      clf.submit(function(e) {
        e.preventDefault();
        clh.html(clh.html() + cl.val() + "\n");
        now.runCommand(cl.val());
        cl.val("");
        clc.scrollTop = clc.scrollHeight + 20;
        return false;
      });
      $("#console").click(function() {
        cl.focus();
      });
      now.consoleOutput = function(data) {
        clh.html(clh.html() + data);
        clc.scrollTop = clc.scrollHeight + 20;
      };
      now.saved = function(error) {
        if (error) alert("error saving file");
      };
    }
    else {
      setTimeout(waitForNow, 10);
    }
  }
  waitForNow();
});
