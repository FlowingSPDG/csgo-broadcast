$("#match_id, #match_frag").keyup(function () {
    //console.log('changed')
    console.log($("#match_id").val())
    var result = "playcast \"" + match + $("#match_id").val() + "\" f" + $("#match_frag").val();
    $("#match_command").attr("value", result)
});

function CopyClipBoard() {
    /* Get the text field */
    var copyText = $("#match_command");
  
    /* Select the text field */
    copyText.select();
  
    /* Copy the text inside the text field */
    document.execCommand("copy");
  
    /* Alert the copied text */
    alert("Copied the text: " + copyText.val());
}