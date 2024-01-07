// deno run --watch --allow-net --allow-read --allow-env server.ts
import { serveDir } from "https://deno.land/std@0.151.0/http/file_server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { calc_scores } from "./calc_scores.ts";
import { check_tabledata } from "./check_tabledata.ts";
import { generate_personal_scores } from "./data_formatter.ts";


const supabaseUrl  = Deno.env.get("SUPABASE_URL");
const supabaseKey = Deno.env.get("SUPABASE_KEY");


var tabledata: any[] = [];
var tmp_tabledata: any[] = [];

const rank_pts = {
  sanma: [40, 0, -25],
  yonma: [50, 10, -10, -30]
}

const back_pts = {
  sanma: 40000,
  yonma: 30000
}

const gameformats = {
  sanma: "三人",
  yonma: "四人"
}

// var tmp_mode = '';
// var tmp_data = [];

Deno.serve(async (req) => {
  const pathname = new URL(req.url).pathname;
  console.log(pathname);

  const supabase = createClient(supabaseUrl, supabaseKey);

  async function get_data(mode, username){
    var { data, error } = await supabase.from('log_table').select()
      .eq("gameformat", gameformats[mode])
      .eq("username", username)
    return data
  }

  function generate_info(personal_scores, mode) {
    var grid = {};
    grid["columns"] = [
      {
        title: "プレーヤー",
        field: "name",
        formatter: "html",
        // formatterParams: {
        //   labelField: "name",
        //   urlPrefix: "player.html?name=",
        //   target: "_blank",
        // },
      },
      { title: "累計ポイント", field: "total_point", sorter: "number" },
      { title: "平均着順", field: "mean_rank" },
      { title: "トップ率", field: "top_rate" },
      { title: "ラス回避率", field: "las_evasion_rate" },
      { title: "原点確保率", field: "os_rate" },
      { title: "ベストスコア", field: "best_score" },
      { title: "ワーストスコア", field: "worst_score" },
      { title: "箱下率", field: "minus_rate" },
      { title: "連勝数", field: "winning" },
      { title: "試合数", field: "num_games" },
      { title: "東家一着率", field: "ton_top_rate" },
      { title: "南家一着率", field: "nan_top_rate" },
      { title: "西家一着率", field: "sha_top_rate" },
    ];
    if (mode == "yonma"){
      grid["columns"].push({ title: "北家一着率", field: "pei_top_rate" });
    }
    grid["data"] = [];
    var datas = calc_scores( personal_scores , mode, back_pts)
    for (var i = 0; i < datas.length; i++) {
      var name_link =
        `<a class="name_link" href="player.html?name=${datas[i]["name"]}" target="_blank"  rel="noopener noreferrer">${datas[i]["name"]}</a>`;
        datas[i]["name"] = name_link;
      grid["data"].push(datas[i]);
    }
    return grid;
  }

  if (req.method === "POST" && pathname === "/line-chart") {
    var requestJson = await req.json();
    var personal_scores = generate_personal_scores(
      await get_data(requestJson.mode, requestJson.username),
      requestJson.first_date,
      requestJson.last_date,
      requestJson.mode,
      rank_pts,
      back_pts
    );

    let datasets: any[] = [];
    let days_all = [];
    for (var i = 0; i < Object.keys(personal_scores).length; i++) {
      var label = Object.keys(personal_scores)[i];
      var days = personal_scores[label]["days"];
      days_all = days_all.concat(days);
    }
    days_all = Array.from(new Set(days_all));
    days_all.sort();

    for (var i = 0; i < Object.keys(personal_scores).length; i++) {
      var label = Object.keys(personal_scores)[i];
      var data: number[] = [];
      var pt_tmp = 0;
      for (var j = 0; j < days_all.length; j++) {
        var day = days_all[j];
        if (personal_scores[label]["days"].includes(day)) {
          var pt: number = personal_scores[label]["pts"][personal_scores[label]["days"].indexOf(day)];
          pt_tmp += pt;
          data[j] = pt_tmp;
        } else {
          if (j == days_all.length - 1) {
            data[j] = pt_tmp;
          } else {
            data[j] = NaN;
          }
        }
      }
      var borderWidth = 1;
      var dataset = { label, data, borderWidth };
      datasets.push(dataset);
    }

    return Response.json({
      type: "line",
      data: {
        labels: days_all,
        datasets,
      },
      options: {
        scales: {
          y: {
            beginAtZero: true,
          },
        },
        fill: false,
        interaction: {
          intersect: false,
        },
        radius: 0,
      },
    });
  }

  if (req.method === "POST" && pathname === "/table") {
    var requestJson = await req.json();
    var personal_scores = generate_personal_scores(
      await get_data(requestJson.mode, requestJson.username),
      requestJson.first_date,
      requestJson.last_date,
      requestJson.mode,
      rank_pts,
      back_pts
    );
    var info = generate_info(personal_scores, requestJson.mode);
    var config = {
      layout: "fitColumns", //fit columns to width of table
      // responsiveLayout:"hide",  //hide columns that don't fit on the table
      responsiveLayout: "collapse",
      addRowPos: "top", //when adding a new row, add it to the top of the table
      history: true, //allow undo and redo actions on the table
      pagination: "local", //paginate the data
      paginationSize: 7, //allow 7 rows per page of data
      // paginationCounter:"rows", //display count of paginated rows in footer
      movableColumns: true, //allow column order to be changed
      initialSort: [ //set the initial sort order of the data
        { column: "total_point", dir: "desc" },
      ],
      columnDefaults: {
        tooltip: true, //show tool tips on cells
      },
    };

    info = { ...info, ...config };
    return Response.json(info);
  }

  // 個人ページ
  if (req.method === "POST" && pathname === "/myrank") {
    var name = await req.json();
    name = name["name"];
    return new Response(name);
  }

  if (req.method === "POST" && pathname === "/get_start_date") {
    var tmp = await req.json();
    var username = tmp['username'];
    var { data, error } = await supabase.from('log_table').select()
      .eq("username", username);
    data.sort((a,b)=>{  
      if(a['date'] < b['date']) return -1;
      else if(a['date'] > b['date']) return 1;
      return 0;
    })
    if (data.length == 0){
      var dt = new Date();
      var date = `${dt.getFullYear()}-${("00" +
                    (dt.getMonth()+1)).slice(-2)}-${("00" +
                    (dt.getDate())).slice(-2)}`;
    } else {
      var date = data[0]['date'];
    }
    return new Response(date);
  }

  // ログ管理ページ
  if (req.method === "POST" && pathname === "/get_tabledata") {
    var tmp = await req.json();
    var username = tmp['username'];
    var { data, error } = await supabase.from('log_table').select()
      .eq("username", username);
    tabledata = data;
    tmp_tabledata = [...tabledata];
    return Response.json(tabledata);
  }

  if (req.method === "POST" && pathname === "/update_tabledata") {
    tmp_tabledata = await req.json();
    return new Response();
  }

  if (req.method === "POST" && pathname === "/remove_tabledata") {
    var tmp = await req.json();
    for (var i = 0; i < tmp_tabledata.length; i++){
      if (tmp.remove_id == tmp_tabledata[i].id){
        tmp_tabledata.splice(i,1);
      }
    }
    return Response.json(tmp_tabledata);
  }

  if (req.method === "POST" && pathname === "/add_tabledata") {
    var tmp = await req.json();
    var username = tmp['username'];

    // var { data, error } = await supabase.from('log_table').select('id');
    // data.sort((a, b) => -a['id'] + b['id']);
    // tmp_tabledata.sort((a, b) => -a['id'] + b['id']);
    // var tmps: any[] = [];
    // if (data.length != 0){ tmps.push(data[0]['id']) }
    // if (tmp_tabledata.length != 0){ tmps.push(tmp_tabledata[0]['id']) }
    // if (tmps.length!=0){
    //   var new_id: number = Math.max.apply(null, tmps) + 1;
    // } else {
    //   var new_id = 1;
    // }

    var { data, error } = await supabase.from('log_table').select('id');
    var tmps: any[] = [];
    for (var i = 0; i < data.length; i++){ tmps.push(data[i]['id']) }
    for (var i = 0; i < tmp_tabledata.length; i++){ tmps.push(tmp_tabledata[i]['id']) }
    tmps = Array.from(new Set(tmps)).sort();
    var new_id = 0;
    for (var i = 0; i < tmps.length; i++){
      if (tmps[i] != i+1){
        new_id = i+1;
        break;
      }
      new_id = i+2;
    }
    


    
    var dt = new Date();
    var date = `${dt.getFullYear()}/${("00" +
                  (dt.getMonth()+1)).slice(-2)}/${("00" +
                  (dt.getDate())).slice(-2)}`;

    var gamenumber = 1;
    for (var i = 0; i < tmp_tabledata.length; i++){
      if (tmp_tabledata[i].date == date){
        gamenumber += 1;
      }
    }

    var new_data = {
      id: new_id,
      username,
      date,
      ton_player: null,
      ton_score: null,
      nan_player: null,
      nan_score: null,
      sha_player: null,
      sha_score: null,
      pei_player: null,
      pei_score: null,
      gameformat: "三人",
      gamenumber
    } 

    tmp_tabledata.push(new_data)
    return Response.json(tmp_tabledata)
  }

  if (req.method === "GET" && pathname === "/save_tabledata") {
    var error_msgs = check_tabledata(tmp_tabledata);
    if (error_msgs.length == 0){
      for (var i = 0; i < tmp_tabledata.length; i++){
        delete tmp_tabledata[i].remove;
      }
      console.log(tmp_tabledata)

      // 上書き
      var { data, error } = await supabase.from('log_table').upsert(tmp_tabledata);
      // 削除
      var tmp_tabledata_ids:any[] = [];
      for (var i = 0; i < tmp_tabledata.length; i++){
        tmp_tabledata_ids.push(tmp_tabledata[i].id)
      }
      for (var i = 0; i < tabledata.length; i++){
        if (! tmp_tabledata_ids.includes(tabledata[i].id)){
          const { error } = await supabase.from('log_table').delete()
          .eq('id', tabledata[i].id)
        }
      }
      // 新規
      var tabledata_ids:any[] = [];
      for (var i = 0; i < tabledata.length; i++){
        tabledata_ids.push(tabledata[i].id)
      }
      for (var i = 0; i < tmp_tabledata.length; i++){
        if (! tabledata_ids.includes(tmp_tabledata[i].id)){
          var { data, error } = await supabase
            .from('log_table')
            .insert(tmp_tabledata[i]);
        }
      }
      return Response.json([]);
    } else {
      return Response.json(error_msgs);
    }
  }

  if (req.method === "POST" && pathname === "/register") {
    var tmp = await req.json();
    var username = tmp['username'];
    var password = tmp['password'];
    var { data, error } = await supabase.from('userinfo_table').select()
      .eq("username", username);
    var result = false;
    if (data.length == 0 && username != "" && password != ""){
      var { data, error } = await supabase.from('userinfo_table')
      .insert({ username, password });
      result = true;
    }
    return Response.json({result});
  }

  if (req.method === "POST" && pathname === "/login") {
    var tmp = await req.json();
    var username = tmp['username'];
    var password = tmp['password'];
    var { data, error } = await supabase.from('userinfo_table').select()
      .eq("username", username);
    var result = false;
    if (data.length == 1 && username != "" && password != ""){
      if (data[0]['password'] == password){
        result = true;
      }
    }
    return Response.json({result});
  }

  if (req.method === "POST" && pathname === "/deluser") {
    var tmp = await req.json();
    var username = tmp['username'];
    await supabase.from('log_table').delete()
      .eq('username', username);
    
    await supabase.from('userinfo_table').delete()
      .eq('username', username)
    return new Response();
  }

  return serveDir(req, {
    fsRoot: "public",
    urlRoot: "",
    showDirListing: true,
    enableCors: true,
  });
});
