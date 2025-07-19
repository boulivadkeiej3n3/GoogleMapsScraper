/**
 * SCRAPING GOOGLE MAPS USING HEADLESS BROWSER(PUPPETEER)
 *  
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 * 
 */

/** DEPANDENACIES **/
 const FileSystem=require("node:fs");
 const Puppeteer = require("puppeteer");
 const EventEmitter = require("events");
/*******************/

/** GLOBALS **/
  global.PuppeteerEvents = new EventEmitter ();
  /** global.PuppeteerEvents Event Structre:
   * [localCode argument]
   *  (localCode) | VARIANT(String) | Represents the Event String Identifier
   *    localCode:"PuppeteerDataExchange" | To Exchange Data between Running Chromium Instance and Puppeteer Running on NodeJS
   *    localCode:"onDataProcessed"       | To Interexchange data between different parts of the code that have been scraped/processed.
   * 
   * [options argumnet]
   * (code)  Represents the type of data sent to the event listeenr(INFORMATION, Error,..etc)
   *     code:1000 | INFORMATION(Integer) | Data Sent by Chromium Main Exposed Function to NodeJS
   *     code:2000 | ERROR(Integer)       | Represents an Error happened during the operation called by Chromium to NodeJS
   * 
   * (opCode) Represents an identifier to the Operation itself done on Chromium 
   *      opCode:[VARIANT] | IDENTIFIER(Integer)
   *        opCode:200 | Scraped new appearing list of businesses on Google Maps
   *        opCode:300 | Extracted Information from Google Maps Specific URL(s)
   *        opCode:500 | Done Scraping the full list on Google Maps
   *        opCode:600 | Done Extracing all information of all pages for certain "Cateogry"
   * 
   * (data) Attached DATA sent to the event listener
   *      data:[INFORMATION] | INFORMATION(Any) | Data sent to the event listener as an argument
   *      data:[ERROR_INFORMATION] | INFORMATION(Any) | Data about the error emitted by the data emitter for code:2000
   */ 
  global.targettedCity="";
  global.MapsExtractedData={}
  global.currentCategory=""
  global.maxConcurrentPromisesCount=3;
  global.extractPlacesURLsStack=[];
  global.GoogleMapsLangCode="en";
  global.PuppeteerTimeout=60000;
 let $Browser;
 const LOADED_DATA=JSON.parse(FileSystem.readFileSync("data.json"));
 const MapsUIElements={
  "PlaceLocationsList":`div[role="feed"]`,
  "PlaceComponentItem":`div a.hfpxzc`,
  "ListTerminateSign": `div[role="feed"] > div:last-child div p > span > span`,

   SinglePageComponents:{
  "PlaceComponentTitle":[`#QA0Szd > div > div > div.w6VYqd > div:nth-child(2) > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div:nth-child(1) > h1`,"Name","innerText"],
  "PlaceComponentPhoneNumber":[`button[data-item-id*="phone"]`,"Phone","aria-label"],
  "PlaceComponentRating":[`#QA0Szd > div > div > div.w6VYqd > div:nth-child(2) > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div.LBgpqf > div > div.fontBodyMedium.dmRWX > div.F7nice > span:nth-child(2) > span > span`,"Rating","innerText"],
  "PlaceComponentReviewsCount":[`#QA0Szd > div > div > div.w6VYqd > div:nth-child(2) > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div.LBgpqf > div > div.fontBodyMedium.dmRWX > div.F7nice > span:nth-child(1) > span:nth-child(1)`,"ReviewsCount","innerText"],
  "PlaceComponentWebsiteURL":[`a.CsEnBe[aria-label*="Website"]`,"Website","href"],
  "PlaceComponentAddress":[`div[role="region"] > div.RcCsl  > button.CsEnBe`,"Address","aria-label"],
  "PlaceComponentVisibleCatogery":[`#QA0Szd > div > div > div.w6VYqd > div.bJzME.tTVLSc > div > div.e07Vkf.kA9KIf > div > div > div.TIHn2 > div > div.lMbq3e > div.LBgpqf > div > div:nth-child(2) > span:nth-child(1) > span > button`,"VisibleCategory","innerText"]
  }
 }
const PuppeteerExecutablePath = LOADED_DATA.PuppeteerExecutablePath ||"./chrome-win/chrome.exe";
/************/ 
 function JSONtoCSV(Structure={}){
  // console.dir (Structure)
  return Object.entries(Structure).map(([_city,_cityCategories])=>{
    // console.log(_key,Object.keys(_value))
   // console.log("fields: ",Object.keys(Object.values(Object.values(_category)[0])[0]))
    //ERROR HANDLING: IF THE CATEGORY HAS EMPTY ENTRIES, THEN RETURN EMPTY DATA AS WELL FOR THIS ONE
// LOOPING THROUGH EACH GIVEN CITY:
   //_cityCategories: Is the field representing each City's scraped categories
     //****************************************//
    // console.log("<-----------------------EXPORTING DATA ------------------->");
    // console.log ("City: ", _city);
    // console.dir("Category: ",_category);
    // console.log(Object.values(_category)[0]);
    // console.log((Object.values(_category)[0])[0]);
    // console.log(Object.keys(Object.values(Object.values(_category)[0])[0]));
      const FieldsNames=["GoogleMapsURL",...Object.values(MapsUIElements.SinglePageComponents).map(([_,_filedName])=>_filedName),"Category"];
      //LOOPING THROUHG EACH CATEGORY:

     //RETURN EACH CITY'S CATEGORES SEPERATD BY LINES for Each city in the loop:
      return Object.entries(_cityCategories).map(([_categoryName,_category])=>{
        //RETURN EACH CATEGORY FIELDS for Each City in the bigger loop
        const _fieldsValues =(Object.entries(_category)[0])?Object.entries(_category).map(([_,_fieldsNamesAndValues])=>Object.values(_fieldsNamesAndValues)):"";
         // console.log(`_fieldsValues:\n\n`);
         //  console.log(_fieldsValues)
          return `"${_city}:",,"${_categoryName+'"'+(FieldsNames).slice(0,-1).map(_=>",")}\n"${FieldsNames.join('","')}"\n${
           (!_fieldsValues.length)?"":
           _fieldsValues.map((_locationBasicData)=>{
            // console.log("_locationBasicData: \n");
            // console.log(_locationBasicData);
             //**console.log("_locationBasicData:",_locationBasicData,Object.keys(_category)[0]);
             return '"'+[..._locationBasicData,_categoryName].join('","')+'"';
           }).join("\n")
          
         }`
        }).join("\n\n")
      }).join("\n\n")  
 }
function createExposedFunction(options={}){
  /**
   * << HERE IS AN EXPLAINATION OF THE STRUCTURE OF DATA SENT TO THE PuppeteerEvents Emitter  >>
   * 
   * (code)  Represents the type of data sent to the event listeenr(INFORMATION, Error,..etc)
   *     code:1000 | INFORMATION(Integer) | Data Sent by Chromium Main Exposed Function to NodeJS
   *     code:2000 | ERROR(Integer)       | Represents an Error happened during the operation called by Chromium to NodeJS
   * 
   * (opCode) Represents an identifier to the Operation itself done on Chromium 
   *      opCode:[VARIANT] | IDENTIFIER(Integer)
   *        opCode:200 | Scraped new appearing list of businesses on Google Maps
   *        opCode:300 | Extracted Information from Google Maps Specific URL(s)
   *        opCode:500 | Done Scraping the full list on Google Maps
   * (data) Attached DATA sent to the event listener
   *      data:[INFORMATION] | INFORMATION(Any) | Data sent to the event listener as an argument
   *      data:[ERROR_INFORMATION] | INFORMATION(Any) | Data about the error emitted by the data emitter for code:2000
   */
 //Set up the event-loop for NodeJS<->Chromium Data exchange on the exposed function:

  //Creating "sendToNodeJS" function:
 return (_dataToByPassToNodeJS="EMPTY",opCode=1,_localCode="PuppeteerDataExchange")=>{
    global.PuppeteerEvents.emit(_localCode,
      {
        code:1000,//INFORMATION
        opCode:opCode,//SOURCE
        data:_dataToByPassToNodeJS//INFORMATION
      });
 } 
}

async function executePlacesURLsReqeusts(){
  let terminateStatus=false;
  //This value dynamically change based on request coming from the main() function in the ARRAY_OF_REQUESTS called "SET_CATEGORY:[Category Name]"
  //The value of this variable determines which category should the following requests be added to in the global object.
  let IncomingRequestsCurrentCategory = global.currentCategory;
  /**
   * This function executes the requests to extract basic data on a page of a business on google maps chunk by chunk
   * It runs infinitely, it waits for few seconds when the stack is empty before looping throuhg it. 
   * 
   * 
   * 
   * 
   * 
   * 
   * 
   * 
   */ 
  while(true){
    //Check if the stack is empty, then wait for few seconds and skip this iteration:
    if(!global.extractPlacesURLsStack.length){await new Promise(res=>setTimeout(res),1000);continue} 
    //FUNCTION BODY:
 console.log(`CURRENT CALLSTACK(BEFORE)[${global.extractPlacesURLsStack.length}]:\n\t`);
   console.log(global.extractPlacesURLsStack);
    console.log(`<<------|------|------|------|------|------|------|------|------>>`);
    //Execute the requests "chunk-by-chunk" and remove them from the global stack, then wait for lesser seconds and do the next iteration:
          const ExtractedDataWithURLs=((await Promise.allSettled(
                  global.extractPlacesURLsStack.splice(0,global.maxConcurrentPromisesCount).map(_fetchedBusinessURL=>{
                    if(!_fetchedBusinessURL || _fetchedBusinessURL=="TERMINATE"){
                      return "TERMINATE"
                      }else if(_fetchedBusinessURL.match("FINISHED")){
                        //Send a puppeteer singal 600 to identify that _targettedCateogry business list was finished and extracted.
                       global.PuppeteerEvents.emit("onDataProcessed",
                            {
                                code:1000,//INFORMATION
                                opCode:600,//SOURCE
                                data:{category:_fetchedBusinessURL.match(/(?<=\:).+/)[0]}//INFORMATION
                        });
                        return undefined;
                      }else if(_fetchedBusinessURL.match("SET_CATEGORY")){
                          IncomingRequestsCurrentCategory= _fetchedBusinessURL.match(/(?<=\:).+/)[0]
                        return undefined;
                      } 
                     return fetchLocationBasicDataFromGoogleMaps(_fetchedBusinessURL);
                   })
                  ))
                  .map(({value:_basicBusinessData},fragmentCounterIndex)=>{
                    // console.log(Object.values(_basicBusinessData).join("\n<------>\n"));

                  //**  console.log(`[executePlacesURLsReqeusts INFO]:
                   //**               Currently Dealing with:
                    //**              ${_basicBusinessData}
                 //**                 --------------->
                  //**              `)
                    //If Failed to Fetch Data/ Or Passed false values on purpose, then skip this process:
                    if(typeof(_basicBusinessData)=="string"){
                   //**   console.log("PASSED BASIC BUSINESS DATA STRING:\n ", _basicBusinessData);
                     if(_basicBusinessData.toLowerCase()=="terminate"){
                  //**    console.log(`[executePlacesURLsReqeusts]: Terminal Signal Is Located.`);
                       terminateStatus=true;
                     }    
                    }

                    if(_basicBusinessData!=="TERMINATE"&&_basicBusinessData){
                       // {console.log("OnDefine: \n");console.log(_basicBusinessData)}
                //**         console.log("\n----->\n",global.targettedCity,"\n",global.currentCategory,"\n",_basicBusinessData._url,"\n<--------")
              //**            console.dir(global.MapsExtractedData[global.targettedCity][global.currentCategory]);
                        global.MapsExtractedData[global.targettedCity][IncomingRequestsCurrentCategory][_basicBusinessData._url]=_basicBusinessData;
                         return {[_basicBusinessData._url]:_basicBusinessData};
                    }
                  }))
/**************************************/
    //Remove those first number of global.maxConcurrentPromisesCount from the stack
                  // global.extractPlacesURLsStack.splice(0,global.maxConcurrentPromisesCount);
/*********************************/
                  //Send a signal to the PuppeteerEvents(Event Emitter) alongisde the data fetched:
                       global.PuppeteerEvents.emit("onDataProcessed",
                            {
                                code:1000,//INFORMATION
                                opCode:300,//SOURCE
                                data:ExtractedDataWithURLs//INFORMATION
                        });
              //Execute Custom Callback:
   //** console.log(`CURRENT CALLSTACK(AFTER)[${global.extractPlacesURLsStack.length}]:\n\t`);
 //**   console.log(global.extractPlacesURLsStack);
 //**   console.log(`<<------|------|------|------|------|------|------|------|------>>`);
    //Terminate if requested to [This signal is activated when all _targettedCategories requests were executed, either failed of succeeded]:
     if(terminateStatus)break;
     //Give it some time to rest before going into the next steps:
         await new Promise(res=>setTimeout(res,3000));


  }
  return true;
}

async function _fetchBusinessLocationsList(_targettedPage,_targettedCity,_targettedCategory,_callback=()=>null){
//ERROR HANDLING:
  if(!_targettedPage){throw new Error(`[_fetchBusinessLocationsList ERROR]:\n\t _targettedPage Passed Must NOT BE NULL!`)}
  if(!_targettedCity || typeof(_targettedCity)!=="string"){throw new Error(`[_fetchBusinessLocationsList ERROR]:\n\t _targettedCity Passed Must NOT BE NULL! And Must be of Type "string"`)}
  if(!_targettedCategory || typeof(_targettedCategory)!=="string"){throw new Error(`[_fetchBusinessLocationsList ERROR]:\n\t _targettedCategory Passed Must NOT BE NULL! And Must be of Type "string"`)}
//Configurations:
  let continueScrolling=true;
  const LocationsListFetchedDataURLs=[];
  const operationStatus=true; //Used to represent whether the page was loaded successfully and the first column of businesses were extracted. TRUE means the page loaded successfully, FALSE means otherwise.

  /* async function _autoScrollUntilDone(){
    //Check if the "Terminal Message Appeared Below Before all", IF TRUE, then terminate the scrolling operation:
    if(await Page.$(MapsUIElements.ListTerminateSign)){continueScrolling=false;}
   while(continueScrolling){
        await _targettedPage.evaluate(_ScrollableFeedEl=>_ScrollableFeedEl.scrollTop+=20);
      }
     } */
   async function _fetchGivenNodesURLs(JSNodes=[]){
       return await Promise.all(
        JSNodes.map(_AddedNoded=>{
                   // console.log("Get Property Test: ",_AddedNoded.getProperty("href"))
                return _AddedNoded.evaluate(_el=>_el.getAttribute("href"));
              })
        );

   }  
   //FUNCTION BODY:
   let ScrollableListElement;
   let firstColumnElements;
   try{
     //Go to the right googls maps search keywords page on Google Maps:
         await _targettedPage.goto(`https://www.google.com/maps/search/${_targettedCategory+"+"+"in"+"+"+_targettedCity}?hl=${global.GoogleMapsLangCode}`,{waitUntil:"networkidle0", timeout:PuppeteerTimeout});
     //Find the scrollable "feed" element and auto scroll until the message of ending list appears.
           ScrollableListElement = await _targettedPage.$(MapsUIElements.PlaceLocationsList);
          //Fetch first column of businesses and pass them to the given _callback():
           firstColumnElements=await _fetchGivenNodesURLs(await _targettedPage.$$(`${MapsUIElements.PlaceLocationsList} ${MapsUIElements.PlaceComponentItem}`));
          //** console.log("firstColumnElements: ",firstColumnElements);

           //Send the first wave of extraced data to the Event Listener Callback via emitting it as a signal
               await global.PuppeteerEvents.emit("PuppeteerDataExchange",
                      {
                        code:1000,//INFORMATION
                        opCode:200,//SOURCE
                         data:firstColumnElements//INFORMATION
                    });
            }   
          catch(localError){
            console.log(`
              [_fetchBusinessLocationsList ERROR]:
              ${localError.message}
          `);
            //An Error Happened and the page that contains the list of businesses wasnt loaded successfully.
            throw new Error(`Main Page didn't load successfully for CATEGORY: ${_targettedCategory},${_targettedCity}\n<<${localError.message}>>\n\n`,{cause:2001});
            operationStatus=false;
          }
        try{  
        //Create a MutationObserver to watch for newly added nodes(div elements representing new locations on the map):
        await ScrollableListElement.evaluate(
          async(ScrollableListElement,ListTerminateSign,LocationsListFetchedDataURLs)=>{
                  let continueScrolling=true;
                  //_logOut(`MutationObserver: ${this}`);
                  const ScrollableListWatchFather = new window.MutationObserver((_observerRecords)=>{
                     //**    console.log("Newly added Items After SCROLLING!");
                     //**    console.log("_observerRecords: ",_observerRecords[0].addedNodes);
                                  const _newlyFetchedLocations = (()=>{
                                                                  const arr=[];
                                                                  for(const addedNode of _observerRecords[0].addedNodes){
                                                                  ///  addedNode.childLIST.
                                                                  //**  console.log(addedNode.classList,"\n\t",addedNode.className)
                                                                    if(addedNode.classList.value.match("TFQHme")){continue};
                                                                          arr.push(addedNode.children[0].children[0].getAttribute("href"))
                                                                        // console.log(`> ELEMENT:`)
                                                                        // console.log(addedNode)
                                                                        // console.log(`> addedNode.children[0]:`)
                                                                        //  console.log(addedNode.childNodes[0]);
                                                                        //   console.log(`> addedNode.children[0].children[0]:`)
                                                                        //  console.log(addedNode.childNodes[0].childNodes[0])
                                                                  } return arr;})()
                                    
                             //**     console.log("_newlyFetchedLocations (URLS): ",_newlyFetchedLocations); 
                                 //Add them to the "Found/fetched" places list:
                                LocationsListFetchedDataURLs.push(_newlyFetchedLocations);
                               //Call the requried Callback(Assigned as a listener as Exposed Function) and pass the newly fetched locations urls to the callback:
                                  sendToNodeJS(_newlyFetchedLocations,200,"PuppeteerDataExchange")
                            //********* _callback.call(null,_newlyFetchedLocations);
      
                         });
                 ScrollableListWatchFather.observe(ScrollableListElement,{childList:true})
                  //Auto scroll and listen for edits in the DOM Tree:
                 while(continueScrolling){


                     ScrollableListElement.scrollTop+=30;
                 //**    console.log(`[_fetchBusinessLocationsList INFO]:
                //**     I KEEP SCROLLING,.....`);
                     await new Promise(res=>setTimeout(res,300));
                      //Check if the "Terminal Message Appeared Below Before all", IF TRUE, then terminate the scrolling operation:
                            if(document.querySelector(ListTerminateSign)){
                              //Send a scraping completion signal back to NodeJS:
                                sendToNodeJS("done",500,"PuppeteerDataExchange");
                    //**            console.log("[_fetchBusinessLocationsList]: Found Terminate Sign on the page itself ")
                              continueScrolling=false;
                          }
                  }
        }, MapsUIElements.ListTerminateSign,LocationsListFetchedDataURLs);
  
           //Send Completion Signal to the Event Listener Callback via emitting it as a signal
               global.PuppeteerEvents.emit("PuppeteerDataExchange",
                      {
                        code:1000,//INFORMATION
                        opCode:500,//SOURCE
                         data:"done"//INFORMATION
                    });
          }catch(localError){
                        console.log(`
              [_fetchBusinessLocationsList ERROR]:
              ${localError.message}
          `);
                        throw new Error(`Error during extraction of URLs businesses' from Google Maps for CATEGORY: ${_targettedCategory},${_targettedCity}\n<<${localError.message}>>\n\n`,{cause:2005});

          }     
  
  return  operationStatus;

}

async function _fetchSpecificedDataFromGoogleLocationPlace(_ElementHandle,_PropertyName="innerText") {
 // if(typeof(_ElementHandleSelector)!=="string"){throw new Error("[_fetchSpecificedDataFromGoogleLocationPlace ERROR]:\n\t _ElementHandleSelector Passed must be of type 'string' ")}
 // const _Element = await 
//**  console.log("_PropertyName: ",_PropertyName);
  const toReturnData= await _ElementHandle.evaluate((_elJS,_PropertyName)=>(_PropertyName=="innerText")?_elJS.innerText:_elJS.getAttribute(_PropertyName),_PropertyName);
//**  console.log("_toReturnData: ",toReturnData);
 return toReturnData;
}
async function fetchLocationBasicDataFromGoogleMaps(_specialRedirectLink){
  //Open the location into page NUMBER 2, or create it if not exists
   const _2ndPage= await $Browser.newPage();
   const localUIElementsInfo = Object.values(MapsUIElements.SinglePageComponents).map(([_selector,_fieldName,_HTMLProperty])=>[_fieldName,_HTMLProperty]);
//**   console.log("_2ndPage: ",_2ndPage);
  try{
  //Goto the special clickable link passed to from the main Google Maps page:
   await _2ndPage.goto(_specialRedirectLink,{
    waitUntil:"networkidle0",
      timeout:PuppeteerTimeout
   });
  //Fetch Data Bits:
    /*[*/
    //************ PlaceComponentTitle MUST BE INDEX OF 0 *****************//
        //_2ndPage.$(MapsUIElements.PlaceComponentTitle),
    //*************************************************************//
        //_2ndPage.$(MapsUIElements.PlaceComponentPhoneNumber),
  //************   PlaceComponentRating MUST OF INDEX 2 *****************//
       // _2ndPage.$(MapsUIElements.PlaceComponentRating),
    //************   PlaceComponentReviewsCount MUST OF INDEX 3 *****************//
        //_2ndPage.$(MapsUIElements.PlaceComponentReviewsCount),
     //*************************************************************//
      //************   PlaceComponentWebsiteURL MUST OF INDEX 4*****************//
        //_2ndPage.$(MapsUIElements.PlaceComponentWebsiteURL),
    //*************************************************************//
       // _2ndPage.$(MapsUIElements.PlaceComponentAddress),
    //**********************************************************//
      //  _2ndPage.$(MapsUIElements.PlaceComponentVisibleCatogery)
   /*]*/


   JSHandlesPromises = (await Promise.allSettled(Object.values(MapsUIElements.SinglePageComponents).map(([_selector])=>_2ndPage.$(_selector,{timeout:PuppeteerTimeout})))).map(({value})=>value)
   //**console.log("JS NODES:\n\t");
  //** console.log(JSHandlesPromises)
   const PlaceLocationFetchedData =(await Promise.allSettled(JSHandlesPromises.map((_element,_index)=>{
       return _fetchSpecificedDataFromGoogleLocationPlace(_element,
         localUIElementsInfo[_index][1]
        /* (_index==0 || _index==3 || _index==2 || _index==6)?"innerText":
        (_index==4)?"href":"aria-label" */);
   }))).map(({value},_index)=>{
    if(!value)return "N/A";
    switch(_index){
     case 1:
      return value.replace(/\D+/g,"")//.match(/\d+/)[0];
      break;
     case 2:
      return value.match(/\d+/)[0];
      break;
     case 5:
      return value.match(/(?<=.+\:).+/)[0];
      break;
     default:
      return value;
    }
   });
        await _2ndPage.close();
    // return {
    //   //I COULD HAVE MERGED TWO ARRAYS ONE THE KEYS NAMES AND ONE FOR THE VALUES AND CONSTRUCTED AN OBJECT "DYNAMICALLY" FROM BOTH, BUT THIS IS WAY MORE TIME EFFICIENT
    //   _url:_specialRedirectLink,
    //   name:PlaceLocationFetchedData[0],
    //   phone:PlaceLocationFetchedData[1],
    //   reviewCount:PlaceLocationFetchedData[2],
    //   rating:PlaceLocationFetchedData[3],
    //   website:PlaceLocationFetchedData[4],
    //   address:PlaceLocationFetchedData[5]
    // };

        return Object.fromEntries([

      ["_url",_specialRedirectLink],
        ...(PlaceLocationFetchedData.map((_extractedPieceOfData,_index)=>{
           return [localUIElementsInfo[_index][0],_extractedPieceOfData]
         }))
        ]);
 }catch(e){
  console.log(`[fetchLocationBasicDataFromGoogleMaps ERROR]`);
  console.log(e);

  //I DON'T KNOW WHY THE FUCK IT DOENS'T GO NEXT WHEN THIS ERROR OCCUR -____-
  await _2ndPage.close();
      /* return {
      //I COULD HAVE MERGED TWO ARRAYS ONE THE KEYS NAMES AND ONE FOR THE VALUES AND CONSTRUCTED AN OBJECT "DYNAMICALLY" FROM BOTH, BUT THIS IS WAY MORE TIME EFFICIENT
      _url:_specialRedirectLink,
      _error:e.message
    }; */

 //**console.log("SUPPOSED UNDEFINED:\n\t");
 //**console.log(Object.fromEntries([
  //**    ["_url",_specialRedirectLink],
    //**    ...(localUIElementsInfo.map(([_nameFiled])=>[_nameFiled,(_nameFiled.toLowerCase()=="name")?e.message:"ERROR"]))
  //**      ])
 //**);
  return Object.fromEntries([
      ["_url",_specialRedirectLink],
        ...(localUIElementsInfo.map(([_nameFiled])=>[_nameFiled,(_nameFiled.toLowerCase()=="name")?e.message:"ERROR"]))
        ]);

  
}
   //Close page after all data has been extracted

   //console.log(`DataBitsPromiseList:\n\t ${PlaceLocationFetchedData}`);

}

function exportData(format="json",options={}){
  //ERROR HANDLING: SETTING DEFAULT VALUES FOR options{}:
   options.segment=options.segment||"full";

   //BODY:
           const jsonToExport = (options.segment=="full")?global.MapsExtractedData: 
                                  {
                                     [global.targettedCity]:{
                                     [options.segment]:global.MapsExtractedData[global.targettedCity][options.segment]
                                    }

                                };
      console.log(`[exportData INFO] JSON TO Export:

        \n=============================>\n`)
      console.dir(jsonToExport);
      console.log("<============================\n")

  switch(format.toLowerCase()){

    case "csv":
         return JSONtoCSV(jsonToExport,options);
      break;
    case "pdf":
      break;
    case "ddb":
      break;
    default:
      // THIS INCLUDES "JSON" format
          return JSON.stringify(jsonToExport);
        }
  }

class PuppeteerEventListenerWrapper{
  //This Function serves as the BASE CALLBACK and a WRAPPER to a bigger callback to the listener
  //It does the basic functionality any callback to this listener must do, then calls the desired callback.
    constructor(_customCallback){
      return (async function ({opCode,data:fetchedBusinessesURLs}){
        switch(opCode){
        case 200:
          //ERROR HANDLING:
            //CHECK IF MapsExtractedData has the required Entries(targettedCity):
            if(!global.MapsExtractedData[global.targettedCity]){
                global.MapsExtractedData[global.targettedCity]={}
            }
           //PUSH THE fetched URLs to our Main URLS Repo for URLs first.
                      if(opCode!==200)console.log(`<<<<----------------------------------------->>>>`)
         //** console.log(`[Puppeteer Event Listener Data]\n\t`);
      //**    console.log({opCode,fetchedBusinessesURLs});
          //CHECK IF MapsExtractedData has the required Entries(currentCategory):
            if(!global.MapsExtractedData[global.targettedCity][global.currentCategory]){
                global.MapsExtractedData[global.targettedCity][global.currentCategory]={}
            }
            //Add those requests to the global.extractPlacesURLsStack:
             global.extractPlacesURLsStack.push(...fetchedBusinessesURLs);
           /*****************/
          break;
        case 500:
          //Notify the user than a list of businesses of this category have been scraped.
          break;
        default:
          return;
        }
        //Run Additional Custom Code if Passed By the User:
        if(_customCallback)_customCallback({opCode,data:fetchedBusinessesURLs});

      })
    }  
}
async function main(_targettedCity,options={}){
  //ERROR HANDLING:
    options._targettedCategories=options._targettedCategories||"all";
    options.PuppeteerEventListener=options.PuppeteerEventListener|| function (_data){console.log("[Puppeteer Events Listener Callback]\n\t"); console.log(_data)}
  
    //Setting Gloabls for further use in the code:
     global.targettedCity=_targettedCity; 
      //CHECK IF MapsExtractedData has the required Entries(targettedCity):
            if(!global.MapsExtractedData[global.targettedCity]){
                global.MapsExtractedData[global.targettedCity]={}
            }
  //[Delayed] Check if _targettedCity Exists
  //FUNCTION BODY:
  
//[EVENT HANDLERS AND LISTENERS ]->>>>>>>>>>>>>>>>>
  //Setup the event listener for Puppeteer-related Events:
   global.PuppeteerEvents.on("PuppeteerDataExchange",(_dataPassedToListener)=>{
     options.PuppeteerEventListener.call(global,_dataPassedToListener);  
   });


  //Setup Event for Execution-loop-related Events:
   global.PuppeteerEvents.on("onDataProcessed",({opCode,data,code})=>{
   // console.log(_dataPassedToListener)
    //Export files as intended when opCode 600 is Passed with {category:CATEGORY}:
    switch(opCode){
    case 600:
           console.log(`[MAIN]: Exporting Category:${data.category} to ${LOADED_DATA.ExportPath}${options.export.replace(/\..+/,_extension=>"-"+data.category+_extension)}`);
         FileSystem.writeFileSync((`${LOADED_DATA.ExportPath}${options.export.replace(/\..+/,_extension=>"-"+data.category+_extension)}`||"exports.json"),exportData(options.export.match(/(?<=\.).+/)[0], {segment:data.category}));
      break;

    }

      options.PuppeteerEventListener.call(global,{opCode,data,code});  
   });
//[<-><-><-><-><-><-><-><-><-><-><-><-><-><-><-><-><-><-><-><->]

//Preparing Log File:
  FileSystem.appendFile(LOADED_DATA.ExportPath+"logs.txt", `<------[${_targettedCity} | {${options._targettedCategories}} | ${(new Date()).toUTCString()}]------>\n`,()=>{});
  //Assign GoogleMapsSearchPage:
    const GoogleMapsSearchPage=(await $Browser.pages())[0];
  //Setup an exposed Event-emitting function on Puppeteer for data exchange between puppeteer context and Nodejs's:
   GoogleMapsSearchPage.exposeFunction("sendToNodeJS", createExposedFunction());
 //Navigate to GoogleMaps main page first then designated page to avoid bot detection:
  await GoogleMapsSearchPage.goto("https://www.google.com/maps");
  //Check  if passed _targettedCategroies is a "string" or an "array" or is it a reserved keyword(e.g., "all"). If it's "all" then _targettedCategories will be asssigned a value of all possible categories saved; If it's a string, it wil be converted into an array; and if it's an array, Then return as is
  const categoriesScope = (options._targettedCategories=="all")?LOADED_DATA.business_categories:(typeof(options._targettedCategories)=="string")?[options._targettedCategories]:options._targettedCategories;
  //Fetch _targettedCatogries for _targettedCity One by One

    //Loop Through each category in the list LOADED_DATA.business_categories and fetch each visible business:
    for(let categoriesScopeIndex=0; categoriesScopeIndex<categoriesScope.length;categoriesScopeIndex++){
      //**console.log(`businessCategory: \n\t${categoriesScope[categoriesScopeIndex]}`);
       global.currentCategory=categoriesScope[categoriesScopeIndex];
       global.MapsExtractedData[global.targettedCity][categoriesScope[categoriesScopeIndex]]={};

      try{
        //Set Category of incoming requests to the executeRequestsURLs() function:
        global.extractPlacesURLsStack.push(`SET_CATEGORY:${categoriesScope[categoriesScopeIndex]}`);
        //Start searching for all posisble businesses on google maps page:
        await _fetchBusinessLocationsList(GoogleMapsSearchPage,_targettedCity,categoriesScope[categoriesScopeIndex]);
       //**console.log(`[MAIN]: Category: ${categoriesScope[categoriesScopeIndex]} is Finished.`);
        // Send the signal for the execution loop to export the data for this category already. 
        global.extractPlacesURLsStack.push(`FINISHED:${global.currentCategory}`);

        FileSystem.appendFile(LOADED_DATA.ExportPath+"logs.txt", `${categoriesScope[categoriesScopeIndex]}:STATUS=true\n`,()=>{});

      }catch(emittedError){
         // Send the signal for the execution loop to export the data for this category already. 
         global.extractPlacesURLsStack.push(`FINISHED:${global.currentCategory}`);

        /**
          * Thrown Error Structure:
          *   {
          *     (error) | String | A descriptive custom error string for the errot tha happend
          *       VARIANT,
          * 
          *     (errorCode) | INTEGER | A custom number represnting the error code, aka. why the error emitted
          *       [
          *         2001 => The Main Page that contains the list of businesses for the _targettedCategory AND _targettedCity failed to load on Puppeteer.
                    2005 =>  an Error occurred during extracting the URLs lsit from Businesses' URLs from the google maps page at _targettedCategory and _targettedCity[Could be that "HTML Node" problem with selector or exceeded awaiting duration]
                  ],
          * 
          *     (localError) | Error | The original Error(class) that was emitted during the execution before emitting this custom error
          *       INSTANCE OF Error
          *   }
           */
          console.log(` [_fetchBusinessLocationsList ERROR]: ${emittedError.message}`);
            FileSystem.appendFile(LOADED_DATA.ExportPath+"logs.txt", `${categoriesScope[categoriesScopeIndex]}:STATUS=false,ERROR=${emittedError.message}\n`,()=>{});

        console.log(emittedError.cause);
        //Execute callback onError() if exists:
        if(options.onError){options.onError(emittedError)}

        switch(emittedError.cause){
      //IF AN ERROR OCCURS During extracting the URLs lsit from Businesses' URLs from the google maps page at _targettedCategory and _targettedCity[Could be that "HTML Node" problem with selector or exceeded awaiting duration]:
        case 2005:
           //Redo this _targettedCategory by decreasing the index counter by one, so that it repeats for the next iteration:
           //[DISPUTED]:
             //original: categoriesScopeIndex--;break;

              continue;


            /**********************************/
      //DEFAULT && IF AN ERROR OCCURS During extracting of the main list of Businesses' URLs from the google maps page at _targettedCategory and _targettedCity[Didn't Load Successfully]:
        case  2001:
          continue;

        default:
          continue;
          //LEFT BLANK
        }


      }

     // Send the signal for the execution loop to export the data for this category already. 
     //  global.extractPlacesURLsStack.push(`FINISHED:${global.currentCategory}`);

    }
    console.log(`MAIN: --> Reached Her`)
  //ALL Categories in _targettedCategories URLs Lists have been loaded, THEN Add termination sign for the request searcher:
       global.extractPlacesURLsStack.push("TERMINATE");
      
     //** console.log(`[Main]: Reminain Requests\n`,global.extractPlacesURLsStack);
  //IF extractPlacesURLsStack are empty right away, that means there was a problem above, Hence...CANCEL
    if(global.extractPlacesURLsStack.length==0){
      return false;
    }

  //************** HERE ALL THE URLs Availble on the GoogleMaps Category Search are scraped ****************//
   //** console.log(`[MAIN]: All URLs on the List have been extracted...`);
  //************* HERE ALL Scraping Stack Requests have beeen executed *****************// 
    
    //Awaiting all global.extractPlacesURLsStack to be processed(for the stack to be empty):
    /* await new Promise(res=>{
        let _clockInterval;
        _clockInterval= setInterval(()=>{if(global.extractPlacesURLsStack.length==0){clearInterval(_clockInterval); res("")}},5000);
    }); */
    await global.executeGoogleMapsRequestsProcessPromise  
    //CLOSE BROWSER AFTER ALL REQUESTS HAVE BEEN PROCESSED:
    await $Browser.close();
    console.log(`[MAIN]: All Scraping Requests Have been processed.`);

    console.log(`[MAIN]: Exporting to ${options.export}`);
    FileSystem.writeFileSync((LOADED_DATA.ExportPath+options.export||"exports.json"),exportData(options.export.match(/(?<=\.).+/)[0]));
    FileSystem.writeFileSync((LOADED_DATA.ExportPath+"exports.json"),exportData("json"));

 return true;
}
async function init(_targettedCity,_targettedCategory,_exportFileName){
  /* ERROR CODES    [PREFIX: '10']
   * 1010 => Passed UNDEFINED city name to _targettedCity
   * 1020 => Passed Category is not of the type String nor Array.
   * 1030 => Passed Category is not listed in data.json nor it equals to "all"
   */
  //************************************//

  // ERROR HANDLING:
      if(!_targettedCity) throw new Error("Passed 'city' must not be of type undefined", {cause:{code:1010}});
    
     if(!_targettedCategory instanceof String || !_targettedCategory instanceof Array) throw new Error("Passed Category must be either a String or an Array",{cause:{code:1020}});
       if(_targettedCategory instanceof String){
       if(!LOADED_DATA.business_categories.includes(_targettedCategory.toLowerCase())&& _targettedCategory!=="all")throw new Error("Passed Category must be either listed in data.json or equal to 'all'",{cause:{code:1030}}); 
     }
  //*************************************//
  
  
  //Run Puppeteer Browser
  $Browser = await Puppeteer.launch({executablePath:PuppeteerExecutablePath, headless:false});
   //After the Execution is complete, close the browser, and terminate the request searcher:
  //********************** ARGUMENTS *******************//
  const onError=()=>{
        console.log("What are you looking at my friend??");
    };
  //Additional Code Passed to PuppeteerEventListenerWrapper(class) Instance for additonal custom code when listening on PuppeteerDataExchange(event);
  const PuppeteerEventListenerCallback=()=>{
    console.log("<<----------[PuppeteerEventListenerCallback]: Working!---------->>");
  }  
 //****************************************************//   
global.executeGoogleMapsRequestsProcessPromise=executePlacesURLsReqeusts();
 /* global.executeGoogleMapsRequestsProcessPromise.finally(res=>{
     console.log(`TERMINAL SIGN HAVE BEEN SENT`);
       $Browser.close();
  }); */ 
  await main(_targettedCity,{
   PuppeteerEventListener: new PuppeteerEventListenerWrapper(PuppeteerEventListenerCallback),
    _targettedCategories:_targettedCategory,
    //onError,
    export:_exportFileName||`${_targettedCity}_${(_targettedCategory)?(_targettedCategory instanceof Array)?"MANY":_targettedCategory:"all"}_${(new Date()).toString().match(/.+ (?=\d+\:\d+\:\d+.+)/)}.csv`
  
  });
}
init("Hurghada",["compound","resort","complex"]);
// 
// const DataToBeExported = {
//   'nag hammadi': {
//     airport: {},
//     gym: {
//       [`https://www.google.com/maps/place/Fit+zone/data=!4m7!3m6!1s0x1448d105dadb
// 22a3:0x17b83252a535b09!8m2!3d26.0434456!4d32.2395661!16s%2Fg%2F11hfr08bv3!19sChI
// JoyLb2gXRSBQRCVtTKiWDewE?authuser=0&hl=en&rclk=1`]: {
//      "_url":"NOT FOUND",
// 
//   name:"Gym#1",
//    Phone:"+20100233030",
//    "Rating":"5.0",
//    "ReviewsCount":10,
//    "Website":"N/A",
//    "Address":"Al Ahyeaa",
//    "VisibleCategory":"Gym"
//  },
//       [`https://www.google.com/maps/place/DB+Gym+Fitness+Healthy+club/data=!4m7!3
// m6!1s0x1448d10003096287:0x538d64a97207217e!8m2!3d26.0440911!4d32.2394909!16s%2Fg
// %2F11wfqn5025!19sChIJh2IJAwDRSBQRfiEHcqlkjVM?authuser=0&hl=en&rclk=1`]: {
//    "_url":"NOT FOUND",
//    Name:"Gym#2", 
//    Phone:"+20122663030",   "Rating":"5.0",
//    "ReviewsCount":10,
//    "Website":"N/A",
//    "Address":"Al Ahyeaa",
//    "VisibleCategory":"Gym"},
//       [`https://www.google.com/maps/place/%D8%AC%D9%8A%D9%85+%D8%A7%D9%84%D9%85%D
// 8%B3%D8%AA%D8%B9%D9%85%D8%B1%D8%A9+fit+gym%E2%80%AD/data=!4m7!3m6!1s0x1448d1049d
// 45121f:0xa36b3af8e93bf1df!8m2!3d26.0286562!4d32.2580048!16s%2Fg%2F11wbcfnxwp!19s
// ChIJHxJFnQTRSBQR3_E76fg6a6M?authuser=0&hl=en&rclk=1`]: {   "_url":"NOT FOUND",
// name:"Gym#3", Phone:"+201931843874",   "Rating":"5.0",
//    "ReviewsCount":10,
//    "Website":"N/A",
//    "Address":"Al Ahyeaa",
//    "VisibleCategory":"Gym"},
//     }
//   }
// }
// global.MapsExtractedData=DataToBeExported;
// FileSystem.writeFileSync("Test-mutli.csv",exportData("csv"))
// 


