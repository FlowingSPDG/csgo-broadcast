
const steamplay = "steam://rungame/730/76561202255233023/+playcast%20%22"

function RewriteIp(element,prefix,postfix){ // aタグのリンクを現在のホスト名に書き換える
    var href = steamplay + prefix + element.attr("href");
    console.log("href :" + href + postfix)
    element.attr("href", href + postfix)
}

const ip = location.href;
var match = ip + "match/"
var replay = ip + "replay/"

console.log(ip);

$(function () {  
    $("a[data-type='a_match']").each(function(i){
        RewriteIp($(this),match,"%22")
    });

    $("a[data-type='a_replay']").each(function(i){
        RewriteIp($(this),replay,"%22")
    });

    $("a[data-type='a_replay-a']").each(function(i){
        RewriteIp($(this), match,"%22%20a") // [" a"]
    });
    
    $("a[data-type='a_replay-c']").each(function(i){
        RewriteIp($(this),match,"%22%20c") // [" c"]
    });

    replay_f(0);
})

$("th[data-type='a_replay-f']").children('input').keyup(function () {
    replay_f($(this).val())
    console.log($(this).val())
});

function replay_f(frag) {
    $("th[data-type='a_replay-f']").each(function(i){
        //console.log('test')
        var token = $(this).children('a').attr("data-token")
        var play = steamplay + match + token + "%22%20f" + frag
        console.log(play)
        $(this).children('a').attr("href",play)   
    });
}