function check_tabledata(tabledata){
    var error_msgs:string[] = [];
    var games:string[] = [];
    for (var i = 0; i < tabledata.length; i++){
        var d = tabledata[i];
        games.push(`${d.date}#${d.gamenumber}`);
        if ((d.gameformat == '三人' &&
        (!d.ton_player || !d.nan_player ||
        !d.sha_player || d.pei_player)) ||
        (d.gameformat == '四人' &&
        (!d.ton_player || !d.nan_player ||
        !d.sha_player || !d.pei_player))){
            error_msgs.push(`ID ${d.id}: プレーヤー名の入力数、位置が正しくありません`);
        }
        if ((d.gameformat == '三人' &&
        [...new Set([d.ton_player, d.nan_player, d.sha_player])].length != 3 &&
        d.ton_player && d.nan_player && d.sha_player)||
        (d.gameformat == '四人' &&
        [...new Set([d.ton_player, d.nan_player, d.sha_player, d.pei_player])].length != 4)){
            error_msgs.push(`ID ${d.id}: 入力されたプレーヤー名が重複しています`);
        }
        if ((d.gameformat == '三人' &&
        (d.ton_score == null || d.nan_score == null ||
        d.sha_score == null || d.pei_score != null)) ||
        (d.gameformat == '四人' &&
        (d.ton_score == null || d.nan_score == null ||
        d.sha_score == null || d.pei_score == null))){
            error_msgs.push(`ID ${d.id}: 得点の入力数、位置が正しくありません`);
        }
        if ((d.gameformat == '三人' && 
        d.ton_score+d.nan_score+d.sha_score != 105000) ||
        (d.gameformat == '四人' && 
        d.ton_score+d.nan_score+d.sha_score+d.pei_score != 100000)){
            error_msgs.push(`ID ${d.id}: 入力された得点が正しくありません`);
        }
        if (new Date(d.date) > new Date()){
            error_msgs.push(`ID ${d.id}: 入力された日付が正しくありません`);
        }
        if (!d.date){
            error_msgs.push(`ID ${d.id}: 日付が入力されていません`);
        }
        if (!d.gamenumber){
            error_msgs.push(`ID ${d.id}: 対局回数が入力されていません`);
        }
    }

    var games = Array.from(new Set(games.filter(function (x, i, self) {
        return self.indexOf(x) !== self.lastIndexOf(x);
    })));
    for (var i = 0; i < games.length; i++){
        error_msgs.push(`${games[i]} が重複しています`);
    }

    return error_msgs;
}

export { check_tabledata };
