function get_rank_pt(d, rank_pt, back_pt, kaze_list) {
    var tmp_score: any[] = [];
    for (var i = 0; i < kaze_list.length; i++) {
        tmp_score.push({
            name: d[`${kaze_list[i]}_player`],
            score: d[`${kaze_list[i]}_score`],
        })
    }
    tmp_score.sort((a, b) => -a.score + b.score);

    var rank = 1;
    var checked = 0;
    for (var k = 0; k < tmp_score.length; k++) {
        if (checked > k) {
            continue
        }
        var pts = Math.round(
            (rank_pt[rank - 1] + (tmp_score[k]["score"] - back_pt) * 0.001) *
            10,
        ) / 10;
        var same_rank = 1;
        for (var l = k + 1; l < tmp_score.length; l++) {
            if (tmp_score[k]["score"] == tmp_score[l]["score"]) {
                var pt = Math.round(
                    (rank_pt[rank - 1 + l - k] + (tmp_score[l]["score"] - back_pt) * 0.001) *
                    10,
                ) / 10;
                pts += pt;
                same_rank += 1
            } else {
                break
            }
        }
        for (var m = k; m < k + same_rank; m++) {
            tmp_score[m]["rank"] = rank;
            tmp_score[m]["pt"] = Math.round(pts / same_rank * 10) / 10;
        }
        checked += same_rank;
        rank += same_rank;
    }
    return tmp_score
}

function generate_personal_scores(data, first_d, last_d, mode, rank_pts, back_pts) {
    const kaze_lists = {
        sanma: ['ton', 'nan', 'sha'],
        yonma: ['ton', 'nan', 'sha', 'pei']
    }
    var rank_pt = rank_pts[mode];
    var back_pt = back_pts[mode];
    const kaze_list = kaze_lists[mode];
    var personal_scores: { [key: string]: any } = {}
    var first_day = new Date(first_d);
    var last_day = new Date(last_d);
    var users: any[] = [null];
    for (var i = 0; i < data.length; i++) {
        for (var j = 0; j < kaze_list.length; j++) {
            users.push(data[i][`${kaze_list[j]}_player`]);
        }
    }
    users = Array.from(new Set(users));
    users.splice(users.indexOf(null), 1);

    for (var i = 0; i < users.length; i++) {
        var user = users[i];
        personal_scores[user] = {
            days: [],
            scores: [],
            results: [],
            pts: [],
            kazes: []
        }
    }

    for (var i = 0; i < data.length; i++) {
        if (
            first_day > new Date(data[i].date) ||
            new Date(data[i].date) > last_day
        ) { continue; }
        var tmp_scores = get_rank_pt(data[i], rank_pt, back_pt, kaze_list);
        for (var j = 0; j < users.length; j++) {
            var user = users[j];
            for (var k = 0; k < kaze_list.length; k++) {
                if (data[i][`${kaze_list[k]}_player`] == user) {
                    personal_scores[user].days.push(`${data[i].date}#${data[i].gamenumber}`);
                    personal_scores[user].scores.push(data[i][`${kaze_list[k]}_score`]);
                    personal_scores[user].kazes.push(k);
                    for (var l = 0; l < tmp_scores.length; l++) {
                        if (tmp_scores[l].name == user) {
                            personal_scores[user].results.push(tmp_scores[l].rank);
                            personal_scores[user].pts.push(tmp_scores[l].pt);
                            break
                        }
                    }
                }
            }
        }
    }
    return personal_scores;
}

export { generate_personal_scores };
