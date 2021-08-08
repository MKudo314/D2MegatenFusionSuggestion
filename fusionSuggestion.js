/*
    Program Name: fusionSuggestion.js

    Copyright © 2021 MKudoh314Lab All Rights Reserved.
*/


var currentDate = new Date();
//console.log("<p>Time: " + currentDate + " " + currentDate.getMilliseconds() + "</p>");

var ENUMSpecies;
var SpeciesNameList;
var FusionSpeciesRule = [];


function Demon(ID, Name, Grade, Species, FlagFusionMade) {
    var ID;
    var Name;
    var Grade;
    var Species;
    var FlagFusionMade;

    this.ID = ID;
    this.Name = Name;
    this.Grade = Grade;
    this.Species = Species;
    this.FlagFusionMade = FlagFusionMade;
}

var demonArray = [];



// 種族別悪魔リスト
var DemonListBySpecies = [];

//　悪魔合体後の悪魔を返す。合体できない場合はundefinedを返す。
function DemonFusion(demon1, demon2) {
    var grade = Math.floor((demon1.Grade + demon2.Grade) / 2) + 1;
    var species = FusionSpeciesRule[demon1.Species][demon2.Species];
    if (species == ENUMSpecies.NoValue) {
        return undefined;
    }
    var i, fusionDemon;
    for (i = 0; i < DemonListBySpecies[species].length; i++) {
        let value = DemonListBySpecies[species][i];
        if (value == undefined) {
            continue;
        }
        if (value.FlagFusionMade == 0) {
            continue;
        }
        if (value.Grade >= grade) {
            fusionDemon = value;
            break;
        }
    }

    if (fusionDemon != undefined) {
        if (((calcStarGrade(demon1.Grade)) == 5 || (calcStarGrade(demon2.Grade) == 5)) &&
            (calcStarGrade(fusionDemon.Grade) < 5)) {
            // 合体制限ルール1: ☆5悪魔は、☆が下がる合体はしない
            fusionDemon = undefined;
        } else if (((calcStarGrade(demon1.Grade)) == 4 || (calcStarGrade(demon2.Grade) == 4)) &&
            (calcStarGrade(fusionDemon.Grade) < 4)) {
            // 合体制限ルール2: ☆4悪魔は、☆が下がる合体はしない
            fusionDemon = undefined;
        }
    }

    return fusionDemon;
}


function DemonPair(demon1, demon2) {
    var demon1;
    var demon2;
    this.demon1 = demon1;
    this.demon2 = demon2;
}

// 悪魔合体逆引き表
var ReverseFusionArray = [];


// 合体の基本コスト [合体元1☆][合体元2☆][合体後☆]
var FusionMagCostBase = [];
FusionMagCostBase[1] = [[], [0, 5, 50, 5400], [0, 25, 25, 5200], [0, 0, 5, 5000], [0, 0, 5, 2500, 320000], [0, 0, 0, 500, 300000]];
FusionMagCostBase[2] = [[], [], [0, 0, 5, 5000], [0, 0, 5, 2500, 320000], [0, 0, 0, 500, 300000], [0, 0, 0, 0, 150000, 4200000]];
FusionMagCostBase[3] = [[], [], [], [0, 0, 0, 500, 300000], [0, 0, 0, 250, 150000, 4200000], [0, 0, 0, 0, 6000, 3000000]];
FusionMagCostBase[4] = [[], [], [], [], [0, 0, 0, 0, 6000, 3000000], [0, 0, 0, 0, 3000, 1500000]];
FusionMagCostBase[5] = [[], [], [], [], [], [0, 0, 0, 0, 0, 60000]];

// 合体のグレードごとのコスト（合体後のグレード）　グレードの1/10で参照
// グレード53だったら、FusionMagCostGrade[5]
var FusionMagCostGrade = [];
FusionMagCostGrade[0] = 0;
FusionMagCostGrade[1] = 0.15;
FusionMagCostGrade[2] = 0.3;
FusionMagCostGrade[3] = 0.45;
FusionMagCostGrade[4] = 60;
FusionMagCostGrade[5] = 75;
FusionMagCostGrade[6] = 1080;
FusionMagCostGrade[7] = 1260;
FusionMagCostGrade[8] = 14400;
FusionMagCostGrade[9] = 16200;

function calcStarGrade(grade) {
    if (grade < 20) {
        return 1;
    } else if (grade < 40) {
        return 2;
    } else if (grade < 60) {
        return 3;
    } else if (grade < 80) {
        return 4;
    } else {
        return 5;
    }
}

// flagSotai: 0->アーキタイプあり、1->素体同士
function calcFusionMagCost(demon1, demon2, flagSotai) {
    if (demon1.Grade > demon2.Grade) {
        let tmp = demon1;
        demon1 = demon2;
        demon2 = tmp;
    }

    var fusionedDemon = DemonFusion(demon1, demon2);
    if (fusionedDemon == undefined) {
        return -1;
    }
    var starGrade1 = calcStarGrade(demon1.Grade);
    var starGrade2 = calcStarGrade(demon2.Grade);
    var starGradeFusioned = calcStarGrade(fusionedDemon.Grade);
    var magCost = FusionMagCostBase[starGrade1][starGrade2][starGradeFusioned] + (fusionedDemon.Grade - (demon1.Grade + demon2.Grade) / 2) * FusionMagCostGrade[Math.floor(fusionedDemon.Grade / 10)];
    if (flagSotai == 0) {
        return Math.floor(magCost);
    } else if (flagSotai == 1) {
        if (starGradeFusioned == 4) {
            return Math.floor(magCost * 0.5);
        } else if (starGradeFusioned == 5) {
            return Math.floor(magCost * 0.7);
        } else {
            return Math.floor(magCost);
        }
    } else {
        return -1;
    }
}


//　合体の結果、各悪魔が最低コストで作ることができる合体の組み合わせ・マグコスト
var FusionResult = function (sourceDemon1, sourceDemon2, sourceDemon1ArrayID, sourceDemon2ArrayID, magCost) {
    var sourceDemon1, sourceDemon2, sourceDemon1ArrayID, sourceDemon2ArrayID, magCost;

    this.sourceDemon1 = sourceDemon1;
    this.sourceDemon2 = sourceDemon2;
    this.sourceDemon1ArrayID = sourceDemon1ArrayID;
    this.sourceDemon2ArrayID = sourceDemon2ArrayID;
    this.magCost = magCost;
}

var FusionResultArraySotai = [];
var FusionResultArrayAragami = [];
var FusionResultArrayKago = [];
var FusionResultArrayIno = [];
var FusionResultArrayBoma = [];

var FusionResults = [];

function initializeFusionResultArray(resultArray) {
    for (var i = 0; i < demonArray.length; i++) {
        var demon = demonArray[i];
        if (demon == undefined) {
            continue;
        }

        resultArray[i] = new FusionResult(undefined, undefined, undefined, undefined, undefined);
    }
}


function copyFusionResult(newResultArray, oldResultArray) {
    for (var i = 0; i < demonArray.length; i++) {
        var demon = demonArray[i];
        if (demon == undefined) {
            continue;
        }
        newResultArray[i] = oldResultArray[i];
    }
}

// 2つの合成結果リスト同士の合体組み合わせを計算し、合成後の合体結果リストを作成する
// sourceFusionResultArray1 X sourceFusionResultArray2 -> resultFusionResultArray
// resultFusionResultArrayは、最初にsourceFusionResultArray1をコピーし、各合成結果悪魔について、今の値よりもmagCostが小さく作れるなら反映する。
// 1つでも反映できればresultFusionResultArrayを返す。1つも反映が無ければundefinedを返す（合成の結果、変化なし）
function calcFusionResult(sourceFusionResultArray1, sourceFusionResultArray2, sourceDemon1ArrayID, sourceDemon2ArrayID) {
    var currentDate = new Date();
    //console.log("<p>calcFusionResult ArrayID: " + sourceDemon1ArrayID + "," + sourceDemon2ArrayID + "</p>");
    var setFlag = 0;
    var resultFusionResultArray = [];
    copyFusionResult(resultFusionResultArray, sourceFusionResultArray1);


    for (var i = 0; i < demonArray.length; i++) {
        for (var j = 0; j < demonArray.length; j++) {
            let sourceDemon1 = demonArray[i];
            let sourceDemon2 = demonArray[j];
            if ((sourceDemon1 == undefined) || (sourceDemon2 == undefined)) {
                continue;
            }
            if ((sourceFusionResultArray1[sourceDemon1.ID].magCost == undefined) || (sourceFusionResultArray2[sourceDemon2.ID].magCost == undefined)) {
                continue;
            }

            //console.log("FusionResultArray: " + sourceDemon1.Name + " + " + sourceDemon2.Name);
            let resultDemon = DemonFusion(sourceDemon1, sourceDemon2);
            if (resultDemon == undefined) {
                continue;
            }

            let currentFusionResult = resultFusionResultArray[resultDemon.ID];
            //　現時点では、素体合体を前提とする
            let magCost = calcFusionMagCost(sourceDemon1, sourceDemon2, 1) + sourceFusionResultArray1[sourceDemon1.ID].magCost + sourceFusionResultArray2[sourceDemon2.ID].magCost;
            if (sourceDemon1.ID == 195 && sourceDemon2.ID == 197) {
            }
            if ((currentFusionResult.magCost == undefined) || (magCost < currentFusionResult.magCost)) {
                /*
                console.log("<p>FusionResultArray: set FusionResult! : " + resultDemon.Name + " = " + sourceDemon1.Name + "[" + sourceDemon1ArrayID + "]"
                    + " + " + sourceDemon2.Name + "[" + sourceDemon2ArrayID + "]" + ", " + magCost + ", FusionResults.lenth=" + FusionResults.length + "</p>");
                    */
                resultFusionResultArray[resultDemon.ID] = new FusionResult(sourceDemon1, sourceDemon2, sourceDemon1ArrayID, sourceDemon2ArrayID, magCost);
                setFlag = 1;
            }
        }
    }

    if (setFlag == 0) {
        return undefined;
    } else {
        return resultFusionResultArray;
    }
}

var FResultsIDList = [];

// 個数制限付き悪魔の合体結果を作成する
function calcFusionResultWithCondition(availableDemons) {
    var availableDemonstmp = [];
    var sourceFusionResultArray = [];
    var FusionResultsCount = 0;

    for (var i = 0; i < availableDemons.length; i++) {
        availableDemonstmp[i] = availableDemons[i];
    }

    while (1) {
        //console.log("<p>calcFusionResultWithCondition while loop FusionResults.length=" + FusionResults.length + "</p>");
        sourceFusionResultArray = [];
        var setFlag;
        setFlag = 0;
        //for (var i = 0; i < demonArray.length; i++) {
        for (var i = demonArray.length - 1; i >= 0; i--) {
            //console.log("<p>i="+i+", "+availableDemonstmp[i]+"</p>");
            if (availableDemonstmp[i] == -1) {
                sourceFusionResultArray[i] = new FusionResult(undefined, undefined, 0, 0, 0);
            } else if (availableDemonstmp[i] > 0) {
                if (setFlag == 0) {
                    sourceFusionResultArray[i] = new FusionResult(undefined, undefined, 0, 0, 0);
                    setFlag = 1;
                    availableDemonstmp[i]--;
                    //console.log("<p>set Demon=" + demonArray[i].Name + "</p>");
                } else {
                    //sourceFusionResultArray[i] = FusionResults[FusionResultsCount][i];
                    sourceFusionResultArray[i] = FusionResults[0][i];
                }
            } else {
                //sourceFusionResultArray[i] = FusionResults[FusionResultsCount][i];
                sourceFusionResultArray[i] = FusionResults[0][i];
            }
        }
        if (setFlag == 0) {
            //console.log("<p>calcFusionResultWithCondition setFlag is 0, going to break</p>");
            break;
        }

        FusionResults.push(sourceFusionResultArray);
        FusionResultsCount++;

        for (var i = 0; i < 100; i++) {
            result = calcFusionResult(FusionResults[FusionResultsCount], FusionResults[0], FusionResultsCount, 0);
            if (result == undefined) {
                break;
            } else {
                FusionResults.push(result);
                FusionResultsCount++;
            }
        }
        FResultsIDList.push(FusionResultsCount);
    }

    FusionResults.push(FusionResults[FResultsIDList[0]]);
    for (var i = 1; i < FResultsIDList.length; i++) {
        let ResultsID1 = FResultsIDList[i];
        let result = calcFusionResult(FusionResults[FusionResults.length - 1], FusionResults[ResultsID1], FusionResults.length - 1, ResultsID1);
        if (result == undefined) {

            continue;
        } else {
            FusionResults.push(result);
        }
        for (var j = 0; j < 100; j++) {
            result = calcFusionResult(FusionResults[FusionResults.length - 1], FusionResults[0], FusionResults.length - 1, 0);
            if (result == undefined) {
                break;
            } else {
                FusionResults.push(result);
            }
        }

    }

}


function Condition() {
    var availableDemonsSotai;       // 添字がDemonID, 中身が-1: 無制限保持, 0: 保持していない(合体で作る必要あり), 1以上: 個数制限保持
    var availableDemonsAragami;
    var availableDemonsKago;
    var availableDemonsIno;
    var availableDemonsBoma;

    this.availableDemonsSotai = [];
    this.availableDemonsAragami = [];
    this.availableDemonsKago = [];
    this.availableDemonsIno = [];
    this.availableDemonsBoma = [];
}


// Canvasに合成ツリーを絵画する
function drawFusionResultTree(canvas, demonID, fusionResultsCount) {
    var context = canvas.getContext("2d");
    canvas.width = 2000;
    canvas.height = 2000;

    var Yarray = [];
    for (var i = 0; i < 20; i++) {
        Yarray[i] = 50;
    }

    var fusionResult = FusionResults[fusionResultsCount][demonID];
    if (fusionResult.magCost == undefined) {
        canvas.width = 600;
        canvas.height = 400;
        context.font = "20px serif";
        context.fillText("The demon can not be created by fusion under the given condition.", 10, 200);
        return;
    } else {
        drawFusionResultTree2(canvas, demonID, fusionResultsCount, 0, Yarray);
    }
}

var widthOneDemon = 200;
function drawFusionResultTree2(canvas, demonID, fusionResultsCount, level, Yarray) {
    var context = canvas.getContext("2d");
    var fusionResult = FusionResults[fusionResultsCount][demonID];
    if (fusionResult.magCost == undefined) {
        console.log("<p>function drawFusionResultTree2: magCost is undefined" + "</p>");
        return;
    } else if (fusionResult.magCost == 0) {
        context.fillStyle = "red";
        context.font = "12px serif";
        context.fillText(demonArray[demonID].Name + "[" + fusionResultsCount + "]", level * widthOneDemon, Yarray[level]);
        var returnY = Yarray[level];
        Yarray[level] += 20;
        for (let i = 0; i < 20; i++) {
            Yarray[i] = Yarray[level];
        }
        return returnY;
    } else {
        var sourceDemon1 = fusionResult.sourceDemon1;
        var sourceDemon2 = fusionResult.sourceDemon2;
        var Y1 = drawFusionResultTree2(canvas, sourceDemon1.ID, fusionResult.sourceDemon1ArrayID, level + 1, Yarray);
        var Y2 = drawFusionResultTree2(canvas, sourceDemon2.ID, fusionResult.sourceDemon2ArrayID, level + 1, Yarray);
        context.fillStyle = "black";
        context.font = "12px serif";
        var returnY = (Y1 + Y2) / 2;
        context.fillText(demonArray[demonID].Name + " (" + fusionResult.magCost + ") [" + fusionResultsCount + "]", level * widthOneDemon, returnY);
        context.moveTo((level + 0.8) * widthOneDemon, returnY);
        context.lineTo((level + 1) * widthOneDemon, Y1);
        context.moveTo((level + 0.8) * widthOneDemon, returnY);
        context.lineTo((level + 1) * widthOneDemon, Y2);
        context.strokeStyle = "red";
        context.lineWidth = 2;
        context.stroke();
        return returnY;
    }
}



// HTMLの表形式で合成ツリーを作成する
function generateFusionResultTreeTable(demonID, fusionResultsCount) {
    var tableElement = document.createElement("table");

    var Yarray = [];
    for (var i = 0; i < 20; i++) {
        Yarray[i] = 0;
    }

    var fusionResult = FusionResults[fusionResultsCount][demonID];
    if (fusionResult.magCost == undefined) {
        var rowElement = tableElement.insertRow(-1);
        var columnElement = rowElement.insertCell(-1);
        columnElement.appendChild(document.createTextNode("The demon can not be created by fusion under the given condition."));
        return;
    } else {
        generateFusionResultTreeTable2(tableElement, demonID, fusionResultsCount, 0, Yarray);
    }
    return tableElement;
}


function generateFusionResultTreeTable2(tableElement, demonID, fusionResultsCount, level, Yarray) {
    var fusionResult = FusionResults[fusionResultsCount][demonID];
    if (fusionResult.magCost == undefined) {
        console.log("<p>function drawFusionResultTree2: magCost is undefined" + "</p>");
        return;
    } else if (fusionResult.magCost == 0) {
        var text = demonArray[demonID].Name + "[" + fusionResultsCount + "]";
        var rowElement = tableElement.insertRow(-1);
        console.log("GFRTT rowElement:" + rowElement.cells.length);
        while (rowElement.cells.length <= level * 2) {
            rowElement.insertCell(-1);
            console.log("GFRTT rowElement:" + rowElement.cells.length);
        }
        var returnY = Yarray[level];
        /*
                while(tableElement.row.length<=returnY){
                    tableElement.insertRow(-1);
                }
                */
        console.log("GFRTT returnY=" + returnY + "rows:" + tableElement.rows[returnY].cells.length);
        tableElement.rows[returnY].cells[level * 2].appendChild(document.createTextNode(text));
        Yarray[level] += 1;
        for (let i = 0; i < 20; i++) {
            Yarray[i] = Yarray[level];
        }
        return returnY;
    } else {
        var sourceDemon1 = fusionResult.sourceDemon1;
        var sourceDemon2 = fusionResult.sourceDemon2;
        var Y1 = generateFusionResultTreeTable2(tableElement, sourceDemon1.ID, fusionResult.sourceDemon1ArrayID, level + 1, Yarray);
        var Y2 = generateFusionResultTreeTable2(tableElement, sourceDemon2.ID, fusionResult.sourceDemon2ArrayID, level + 1, Yarray);
        var returnY = Math.floor((Y1 + Y2) / 2);
        var text = demonArray[demonID].Name + " (" + fusionResult.magCost + ") [" + fusionResultsCount + "]";
        tableElement.rows[returnY].cells[level * 2].appendChild(document.createTextNode(text));

        tableElement.rows[Y1].cells[level * 2 + 1].appendChild(document.createTextNode("-"));
        for (var i = Y1 + 1; i < returnY; i++) {
            tableElement.rows[i].cells[level * 2 + 1].appendChild(document.createTextNode("|"));
        }
        for (var i = returnY; i < Y2; i++) {
            if (i == Y1) {
                continue;
            }
            tableElement.rows[i].cells[level * 2 + 1].appendChild(document.createTextNode("|"));
        }
        tableElement.rows[Y2].cells[level * 2 + 1].appendChild(document.createTextNode("-"));
        return returnY;
    }
}

// HTMLの箇条書き形式で合成ツリーを作成する
function generateFusionResultTreeUL(demonID, fusionResultsCount) {
    var ulElement = document.createElement("ul");
    ulElement.className = "FusionTreeClassFusionTreeClass";
    ulElement.onclick=ClickEvent; //

    var Yarray = [];
    for (var i = 0; i < 20; i++) {
        Yarray[i] = 0;
    }

    var fusionResult = FusionResults[fusionResultsCount][demonID];
    if (fusionResult.magCost == undefined) {
        ulElement.appendChild(document.createTextNode("選択した使用悪魔では、指定の悪魔は作成できません"));
        return ulElement;
    } else {
        generateFusionResultTreeUL2(ulElement, demonID, fusionResultsCount, 0, Yarray);
    }
    return ulElement;
}


function generateFusionResultTreeUL2(ulElement, demonID, fusionResultsCount, level, Yarray) {
    var fusionResult = FusionResults[fusionResultsCount][demonID];
    if (fusionResult.magCost == undefined) {
        console.log("<p>function drawFusionResultTree2: magCost is undefined" + "</p>");
        return;
    } else if (fusionResult.magCost == 0) {
        var text = generateFusionResultTxt(demonID, fusionResult);
        //var text = demonArray[demonID].Name;
        var returnY = Yarray[level];
        var li2 = document.createElement("li");
        li2.className = "expandableTree"; //
        var textElement = document.createTextNode(text);
        li2.appendChild(textElement);
        li2.style.color = "red";
        ulElement.appendChild(li2);
        //tableElement.rows[returnY].cells[level * 2].appendChild(document.createTextNode(text));
        Yarray[level] += 1;
        for (let i = 0; i < 20; i++) {
            Yarray[i] = Yarray[level];
        }
        return returnY;
    } else {
        var sourceDemon1 = fusionResult.sourceDemon1;
        var sourceDemon2 = fusionResult.sourceDemon2;
        //var text = demonArray[demonID].Name + " (" + fusionResult.magCost + ") [" + fusionResultsCount + "]";
        var text = generateFusionResultTxt(demonID, fusionResult);
        var li2 = document.createElement("li");
        li2.className = "expandableTree closeTree expand"; //
        li2.appendChild(document.createTextNode(text));
        var ul2 = document.createElement("ul");
        
        var Y1 = generateFusionResultTreeUL2(ul2, sourceDemon1.ID, fusionResult.sourceDemon1ArrayID, level + 1, Yarray);
        var Y2 = generateFusionResultTreeUL2(ul2, sourceDemon2.ID, fusionResult.sourceDemon2ArrayID, level + 1, Yarray);
        li2.appendChild(ul2);
        ulElement.appendChild(li2);
        var returnY = Math.floor((Y1 + Y2) / 2);
        return returnY;
    }
}

function getSpeciesName(demonID){
    var demon = demonArray[demonID];
    for (let key in ENUMSpecies) {
        let value = ENUMSpecies[key];
        if(demon.Species == value) {
            return SpeciesNameList[key];
        }
    }    
    return "";
}

//　結果表示の各悪魔の表示テキスト生成
function generateFusionResultTxt(demonID, fusionResult) {
    //console.log("generate: " + demonArray[demonID].Name);
    if (fusionResult == undefined) {
        return "-";
    } else if (fusionResult.magCost == undefined) {
        return "No magCost";
    }

    var txt = demonArray[demonID].Name;
    var speciesName = getSpeciesName(demonID);
    txt += " " + speciesName;

    txt += " ";
    var starGrade = calcStarGrade(demonArray[demonID].Grade);
    /*
    for(var i=0; i<starGrade; i++){
    txt += " ★";
    }
    */
   txt += "星" + starGrade;
    txt += " GR" + demonArray[demonID].Grade + " ";


    var fusionSourceCost = 0;
    if (fusionResult.sourceDemon1 != undefined) {
        fusionSourceCost += FusionResults[fusionResult.sourceDemon1ArrayID][fusionResult.sourceDemon1.ID].magCost;
    }
    if (fusionResult.sourceDemon2 != undefined) {
        fusionSourceCost += FusionResults[fusionResult.sourceDemon2ArrayID][fusionResult.sourceDemon2.ID].magCost;
    }

    //console.log("generate!: " + fusionResult.sourceDemon1ArrayID + ", " + fusionResult.sourceDemon1.ID);
    var fusionCost = fusionResult.magCost - fusionSourceCost;
    if (fusionResult.magCost == 0) {
        txt += " (合体使用悪魔)";
    } else {
        txt += " (計: " + fusionResult.magCost + ", 合体: " + fusionCost + ")";
    }

    return txt;
}


// デバッグ用
function generateFusionTreeDisplayCellTxt(demonID, fusionResult) {
    console.log("generate: " + demonArray[demonID].Name);
    if (fusionResult == undefined) {
        return "-";
    } else if (fusionResult.magCost == undefined) {
        return "No magCost";
    }

    var txt = ""; //demonArray[demonID].Name;
    txt += " (" + fusionResult.magCost + ")";

    if (fusionResult.sourceDemon1 == undefined) {
        txt += "-";
    } else {
        txt += fusionResult.sourceDemon1.Name + "[" + fusionResult.sourceDemon1ArrayID + "] + ";
    }
    if (fusionResult.sourceDemon2 == undefined) {
        txt += "-";
    } else {
        txt += fusionResult.sourceDemon2.Name + "[" + fusionResult.sourceDemon2ArrayID + "]";
    }

    return txt;
}


function checkboxListener(element) {
    //console.log("checkboxListner!: " + element.id);
    var check = false;
    if (element.checked == true) {
        //console.log("checked!");
        check = true;
    } else {
        check = false;
    }
    var starGrade = 0;
    if (element.id == "checkStar1") {
        starGrade = 1;
    } else if (element.id == "checkStar2") {
        starGrade = 2;
    } else {
        return;
    }

    for (var i = 0; i < demonArray.length; i++) {
        if (demonArray[i] == undefined) {
            continue;
        }
        var g = calcStarGrade(demonArray[i].Grade);
        if (g == starGrade) {
            var elementID = "AvailableDemonNoLimit" + i;
            //console.log("elementID=" + elementID);
            var checkElement = document.getElementsByName(elementID);
            checkElement = checkElement[0];
            //console.log("checkElement="+checkElement);
            if (checkElement != undefined) {
                //console.log("check! "+ check);
                checkElement.checked = check;
            }
        }
    }
}


function radioBoxListener(element) {
    var resultTreeElement = document.getElementsByName("resultDemon");
    if (resultTreeElement == undefined) {
        return;
    } else {
        for (var i = 0; i < resultTreeElement.length; i++) {
            if (resultTreeElement[i].checked) {
                element = resultTreeElement[i];
            }
        }
    }

    //console.log("radioBoxListener! : " + element.name + ", " + element.value);

    if (FusionResults.length == 0) {
        return;
    }

    var FusionTreeElement = document.getElementById("FusionTreeTable");
    var resultTreeElement = generateFusionResultTreeUL(element.value, 0);
    while (FusionTreeElement.firstChild) {
        FusionTreeElement.removeChild(FusionTreeElement.firstChild);
    }
    //console.log("resultTreeElement=" + resultTreeElement);
    FusionTreeElement.appendChild(resultTreeElement);

}


function initializeData() {
    initSpeciesFusionTable();
    initDemonData();
}

// 各種初期化
function makeFusionTreeInitialize() {

    // 種族別悪魔リスト
    for (let key in ENUMSpecies) {
        let value = ENUMSpecies[key];
        if (value == -1) {
            continue;
        }
        //console.log("initialize: " + key + ", "+ value);
        DemonListBySpecies[value] = [];
    }

    //　種族別悪魔リストに悪魔追加
    for (let value of demonArray) {
        if (value == undefined) {
            //console.log("<p>undefined!</p>");
            continue;
        }
        //console.log("<p>" + value.Name + ", " + value.Species + "</p>");
        DemonListBySpecies[value.Species].push(value);
    }

    //　種族別悪魔リストをグレードでソート
    for (let key in ENUMSpecies) {
        let value = ENUMSpecies[key];
        if (value == -1) {
            continue;
        }
        //console.log("<p>" + key + ", "+ value + "</p>");
        DemonListBySpecies[value].sort(function (a, b) {
            if (a.Grade < b.Grade) {
                return -1;
            }
            if (a.Grade > b.Grade) {
                return 1;
            }
            return 0;
        })
    }


    // 逆引き表
    for (var i = 0; i < demonArray.length; i++) {
        ReverseFusionArray[i] = [];
    }

    for (var i = 0; i < demonArray.length; i++) {
        for (var j = 0; j < i; j++) {
            let sourceDemon1 = demonArray[i];
            let sourceDemon2 = demonArray[j];
            if ((sourceDemon1 == undefined) || (sourceDemon2 == undefined)) {
                continue;
            }
            let resultDemon = DemonFusion(sourceDemon1, sourceDemon2);
            if (resultDemon == undefined) {
                continue;
            }

            ReverseFusionArray[resultDemon.ID].push(new DemonPair(sourceDemon1, sourceDemon2));
        }
    }

    initializeFusionResultArray(FusionResultArraySotai);
    FusionResults = [];
    FResultsIDList = [];
}


//  オンクリック関数
function makeFusionTreeMain() {
    console.log("<p>makeFusionTreeMain Start!</p>");

    makeFusionTreeInitialize();

    var iCondition = new Condition();

    // 条件のセット1。☆1, 2を無制限に使える。
    for (var i = 0; i < demonArray.length; i++) {
        let demon = demonArray[i];
        if (demon == undefined) {
            continue;
        }

        /*
        let selectID = "AvailableDemon" + i;
        let value = document.getElementById(selectID).value;
        //console.log("Available Demon: " + value);
        if (+value > 0) {
            iCondition.availableDemonsSotai[i] = +value;
            //console.log("Input Available Demon: " + demonArray[i].Name + "=" + value);
        }
        */
        let checkboxID = "AvailableDemonNoLimit" + i;
        value = document.getElementsByName(checkboxID);
        //console.log("value="+value);
        if (value[0].checked) {
            iCondition.availableDemonsSotai[i] = -1;
            //console.log("Input Available Demon: " + demonArray[i].Name + "=-1");
        }
    }


    // ConditionSotaiの無制限悪魔情報をFusionResultArrayに転記
    for (var i = 0; i < demonArray.length; i++) {
        if (iCondition.availableDemonsSotai[i] == -1) {
            FusionResultArraySotai[i] = new FusionResult(undefined, undefined, 0, 0, 0);
        }
    }


    // 無制限悪魔同士の合体での合体結果を作成する。（収束するまで合体を繰り返し）
    for (var i = 0; i < 100; i++) {
        //console.log("Round " + i);
        let result = calcFusionResult(FusionResultArraySotai, FusionResultArraySotai, 0, 0);
        if (result == undefined) {
            break;
        }
        FusionResultArraySotai = result;
    }

    FusionResults.push(FusionResultArraySotai);

    calcFusionResultWithCondition(iCondition.availableDemonsSotai);

    var FusionTreeElement = document.getElementById("FusionTreeTable");
    //console.log("<p>FusionTreeElement = " + FusionTreeElement + "</p>");
    //console.log("FResultsIDList.length: " + FResultsIDList.length);
    //var resultTreeElement = generateFusionResultTreeTable(100, 0);
    var resultDemonElement;
    var resultDemonElementList = document.getElementsByName("resultDemon");
    if (resultDemonElementList == undefined) {
        return;
    } else {
        for (var i = 0; i < resultDemonElementList.length; i++) {
            if (resultDemonElementList[i].checked) {
                resultDemonElement = resultDemonElementList[i];
            }
        }
    }

    //console.log("RDE.value=" + resultDemonElement.value);
    resultTreeElement = generateFusionResultTreeUL(resultDemonElement.value, 0);
    while (FusionTreeElement.firstChild) {
        FusionTreeElement.removeChild(FusionTreeElement.firstChild);
    }
    //console.log("resultTreeElement=" + resultTreeElement);
    FusionTreeElement.appendChild(resultTreeElement);
}




//
// 初期表示用（チェックボックス表示など）
//
function startFunction() {
    initializeData();
    var inputElement = document.getElementById("InputAvailableDemon");
    //var ADTable = document.createElement("table");
    //ADTable.insertRow();        
    for (var i = 0; i < demonArray.length; i++) {
        if (demonArray[i] == undefined) {
            continue;
        }
        var rowElement = inputElement.insertRow(-1);
        var columnElement = rowElement.insertCell(-1);
        columnElement.appendChild(document.createTextNode(calcStarGrade(demonArray[i].Grade)));
        columnElement = rowElement.insertCell(-1);
        columnElement.appendChild(document.createTextNode(demonArray[i].Grade));
        columnElement = rowElement.insertCell(-1);
        columnElement.appendChild(document.createTextNode(demonArray[i].Name));
        columnElement = rowElement.insertCell(-1);

        /*
        var selectElement = document.createElement("select");
        selectElement.id = "AvailableDemon" + i;
        for (var j = 0; j < 6; j++) {
            let optionElement = document.createElement("option");
            optionElement.setAttribute("value", j);
            optionElement.innerHTML = j;
            selectElement.appendChild(optionElement);
        }
        columnElement.appendChild(selectElement);
        columnElement = rowElement.insertCell(-1);
        */

        var checkboxElement = document.createElement("input");
        checkboxElement.type = "checkbox";
        checkboxElement.name = "AvailableDemonNoLimit" + i;
        checkboxElement.value = "1";
        columnElement.appendChild(checkboxElement);

        var radioElement = document.createElement("input");
        radioElement.name = "resultDemon";
        radioElement.type = "radio";
        radioElement.onchange = radioBoxListener;//"radioBoxListener(this);";
        radioElement.value = i;
        columnElement = rowElement.insertCell(-1);
        columnElement.appendChild(radioElement);

    }

}


function ClickEvent() {
    //console.log("srcElement=" + event.srcElement + event.srcElement.innerHTML);
    var sender = event.srcElement || event.target;
    //console.log("sender=" + sender + sender.innerHTML);
    if (sender.nodeName == "LI") {
      var clist = sender.classList;
      if (clist.contains("closeTree")) {
        clist.toggle("expand");
      }
    }
  }
