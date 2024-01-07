function calc_scores(personal_scores, mode, back_pts) {
    var results:any[] = [];
    for (var i = 0; i < Object.keys(personal_scores).length; i++) {

        var name = Object.keys(personal_scores)[i];
        
        var num_games = personal_scores[name]["days"].length;

        var total_point = 0;
        for (var j = 0; j < personal_scores[name]["pts"].length; j++){
            total_point += personal_scores[name]["pts"][j];
        }
        total_point = Math.round(total_point * 100) / 100;

        var mean_rank = 0;
        if (num_games!=0){
            mean_rank = Math.round(
                (personal_scores[name]["results"].reduce((a, b) => {
                    return a + b;
                }) / num_games) * 100,
            ) / 100;
        }

        var top = personal_scores[name]["results"].filter((value) =>
            value == 1
        ).length;
        if (mode == "sanma") {
            var last = personal_scores[name]["results"].filter((value) =>
                value == 3
            ).length;
        } else {
            var last =
                personal_scores[name]["results"].filter((value) => value == 4).length;
        }
        var top_rate = 0;
        if (num_games != 0){
            top_rate = Math.round((top / num_games) * 100) / 100;
        }

        var las_evasion_rate = 0;
        if (num_games != 0){
            las_evasion_rate =
                Math.round(((num_games - last) / num_games) * 100) /
                100;
        }

        var os_rate = 0;
        var back_score = back_pts[mode];
        for (var j = 0; j < personal_scores[name]["scores"].length; j++) {
            if (personal_scores[name]["scores"][j] >= back_score) {
                os_rate += 1;
            }
        }
        os_rate = Math.round((os_rate / personal_scores[name]["scores"].length) * 100) / 100;

        var best_score = Math.max(...personal_scores[name]["scores"]);

        var worst_score = Math.min(...personal_scores[name]["scores"]);

        var minus_rate = 0;
        if (num_games != 0){
            minus_rate = Math.round(
                ((personal_scores[name]["scores"].filter((value) => value < 0).length) /
                    num_games) * 100,
            ) / 100;
        }

        var tmp_winning = 0;
        var winning = 0;
        for (var j = 0; j < personal_scores[name]["results"].length; j++) {
            if (personal_scores[name]["results"][j] == 1) {
                tmp_winning += 1;
            } else {
                tmp_winning = 0;
            }
            if (tmp_winning > winning) {
                winning = tmp_winning;
            }
        }

        var kaze_top_rates: number[] = [];
        var kaze_num = 4;
        if (mode == "sanma") {
            kaze_num = 3;
        }
        for (var j = 0; j < kaze_num+1; j++){
            var win_count = 0
            var kaze_count = 0;
            for (var k = 0; k < personal_scores[name]["kazes"].length; k++){
                if (personal_scores[name]["kazes"][k] == j ){
                    kaze_count += 1;
                    if (personal_scores[name]["results"][k] == 1){
                        win_count += 1;
                    }
                }
            }
            var kaze_top_rate = 0;
            if (kaze_count != 0){
                kaze_top_rate = Math.round(win_count/kaze_count*100)/100;
            }
            kaze_top_rates.push(kaze_top_rate);
        }

        var result = {
            name,
            num_games,
            total_point,
            mean_rank,
            top_rate,
            las_evasion_rate,
            os_rate,
            best_score,
            worst_score,
            minus_rate,
            winning,
            ton_top_rate: kaze_top_rates[0],
            nan_top_rate: kaze_top_rates[1],
            sha_top_rate: kaze_top_rates[2]
        };
        if (mode == 'yonma'){
            result["pei_top_rate"] = kaze_top_rates[3];
        }
        results.push(result);
    }
    return results;
}

export { calc_scores };
