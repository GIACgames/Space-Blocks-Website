import * as dtm from "./Configuration/dataTypeManager.js"
import * as cP from "./Configuration/configPanels.js";
import * as cM from "./PreviewCanvas/previewCanvasManager.js";
import * as terrainGen from "./Generation/terrainGeneration.js";
import * as customMaths from "./General/customMaths.js";
import * as uniGen from "./Generation/universeGeneration.js"


class EditorWidgetApp
{
  constructor()
  {
    this.refs = 
    {
      dtm:dtm,
      cP:cP,
      cM:cM,
      terrainGen:terrainGen,
      customMaths:customMaths,
      uniGen:uniGen
    }
  }
  start()
  {
    this.refs.terrainGen.setupDataTypes(this.refs);
    this.refs.uniGen.start(this.refs);
    this.refs.cM.start(this.refs);
    this.refs.cP.start(this.refs);
  }
  loop()
  {
    this.refs.cM.loop();
  }
  resize()
  {
    this.refs.cM.resize();
  }
}

export { EditorWidgetApp }