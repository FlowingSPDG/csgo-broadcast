
const steamplay = "steam://rungame/730/76561202255233023/+playcast%20%22"

function RewriteIp(element,prefix){ // aタグのリンクを現在のホスト名に書き換える
    var href = steamplay + prefix + element.attr("href");
    console.log("href :" + href + "%22")
    element.attr("href", href + "%22")
}

var ip = location.href;
var match = ip + "match/"
var replay = ip + "match/"

console.log(ip);

$(function () {  
    $('#a_match').each(function(index, element) {
        RewriteIp($(element),match)
    })

    $('#a_replay').each(function(index, element) {
        RewriteIp($(element),replay)
    })
});