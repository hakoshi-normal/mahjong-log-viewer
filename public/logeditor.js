var myTable = null;
var tabledata = null;

async function data_update(data, tabledata){
    for (var i = 0; i < tabledata.length; i++){
        if (tabledata[i].id == data.id){
            tabledata[i] = data;
            break
        }
    }
    const response = await fetch("/update_tabledata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tabledata)
    });
    return response
}

async function data_update_calendar(data, tabledata){
    var gamenumber = 0;
    for (var i = 0; i < tabledata.length; i++){
        if (tabledata[i].date == data.date){
            gamenumber += 1;
        }
    }
    data.gamenumber = gamenumber;
    for (var i = 0; i < tabledata.length; i++){
        if (tabledata[i].id == data.id){
            tabledata[i] = data;
            break
        }
    }
    draw_table(tabledata);
    await data_update(data, tabledata);
}

async function data_remove(data, tabledata){
    const response = await fetch("/remove_tabledata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({tabledata, remove_id: data.id})
    });
    tabledata = JSON.parse(await response.text());
    await draw_table(tabledata);
}

async function draw_table(tabledata) {
    // add remove field
    for (var i = 0; i < tabledata.length; i++){
        tabledata[i]['remove'] = false;
    }
    if (myTable != null) {
      myTable.destroy();
    }
    //initialize table
    var myTable = new Tabulator("#table", {
        data:tabledata,           //load row data from array
        // layout:"fitColumns",      //fit columns to width of table
        // layout: "fitDataStretch",
        layout: "fitDataTable",
        layoutColumnsOnNewData:true,
        responsiveLayout:"hide",  //hide columns that don't fit on the table
        addRowPos:"top",          //when adding a new row, add it to the top of the table
        history:true,             //allow undo and redo actions on the table
        pagination:"local",       //paginate the data
        paginationSize:7,         //allow 7 rows per page of data
        paginationCounter:"rows", //display count of paginated rows in footer
        movableColumns:true,      //allow column order to be changed
        initialSort:[             //set the initial sort order of the data
            {column:"gamenumber", dir:"desc"},
            {column:"date", dir:"desc"}
        ],
        columnDefaults:{
            tooltip:true,         //show tool tips on cells
        },
        columns:[                 //define the table columns
            {title:"ID", field:"id"},
            {title:"Date", field:"date", editor:"date", editorParams:{ format: "yyyy/MM/dd" }, cellEdited:async function(cell){ await data_update_calendar(cell.getRow()._row.data, tabledata) },},
            {title:"GameNumber", field:"gamenumber", editor:"number", editorParams:{ min:1 }, cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            {title:"GameFormat", field:"gameformat", editor:"list", editorParams:{values:["三人", "四人"]}, cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            {title:"Ton_Player", field:"ton_player", editor:"input", cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            {title:"Ton_Score", field:"ton_score", editor:"number", editorParams:{ step:100 }, cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            {title:"Nan_Player", field:"nan_player", editor:"input", cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            {title:"Nan_Score", field:"nan_score", editor:"number", editorParams:{ step:100 }, cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            {title:"Sha_Player", field:"sha_player", editor:"input", cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            {title:"Sha_Score", field:"sha_score", editor:"number", editorParams:{ step:100 }, cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            {title:"Pei_Player", field:"pei_player", editor:"input", cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            {title:"Pei_Score", field:"pei_score", editor:"number", editorParams:{ step:100 }, cellEdited:async function(cell){ await data_update(cell.getRow()._row.data, tabledata) },},
            // {title:"Remove", field:"remove", formatter:"image", cellClick:async function(e, cell){ await data_remove(cell.getRow()._row.data, tabledata) },},
            {title:"Remove", field:"remove", formatter:"tickCross", hozAlign:"center", cellClick:async function(e, cell){ await data_remove(cell.getRow()._row.data, tabledata) },},
        ],
    });
}

async function data_save(){
    const response = await fetch("/save_tabledata");
    const error_msgs = JSON.parse(await response.text());
    if (error_msgs.length != 0){
        alert( error_msgs.join('\n') );
    } else {
        window.location.href = "index.html";
    }
}

async function data_add(){
    var username = localStorage.getItem("username");
    const response = await fetch("/add_tabledata", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username })
    });
    const tabledata = JSON.parse(await response.text());
    await draw_table(tabledata);
}


function change_color() {
    if (document.getElementById("darkmode").checked) {
        localStorage.setItem("color", 'dark');
        document.getElementById("original_stylesheet").href = "styles/style_dark.css";
        document.getElementById("tabulator_stylesheet").href = "https://unpkg.com/tabulator-tables/dist/css/tabulator_midnight.css";
    } else {
        localStorage.setItem("color", 'light');
        document.getElementById("original_stylesheet").href = "styles/style_light.css";
        document.getElementById("tabulator_stylesheet").href = "https://unpkg.com/tabulator-tables/dist/css/tabulator.min.css";
    }
}

window.onload = async function () {
    // HTML読み込み時にカラーモードを反映
    var color = localStorage.getItem("color");
    if (color == null){
        color = 'dark';
        localStorage.setItem("color", color);
    }
    if (color == 'dark'){
        document.getElementById('darkmode').checked = true;
    } else {
        document.getElementById('darkmode').checked = false;
    }
    change_color()

    var username = localStorage.getItem("username");
    var password = localStorage.getItem("password");
    var response = await fetch("/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
    });
    const jsonData = JSON.parse(await response.text());
    if (!jsonData.result){        // ログインページに遷移
        window.location.href = "./login.html";
    } else {
        const response = await fetch("/get_tabledata", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username })
        });
        const tabledata = JSON.parse(await response.text());
        await draw_table(tabledata);
    }
}


function change_color() {
    if (document.getElementById("darkmode").checked) {
      document.getElementById("original_stylesheet").href = "styles/style_dark.css";
      document.getElementById("tabulator_stylesheet").href = "https://unpkg.com/tabulator-tables/dist/css/tabulator_midnight.css";
    } else {
      document.getElementById("original_stylesheet").href = "styles/style_light.css";
      document.getElementById("tabulator_stylesheet").href = "https://unpkg.com/tabulator-tables/dist/css/tabulator.min.css";
    }
}
