import React from 'react';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import SurveyEditor from "../components/SurveyEditor";
import { useParams } from "react-router-dom";
import MenuBar from "./MenuBar"; // Import the MenuBar component

const SurveyEdit = () => {
  const { companyId, shopId } = useParams();

  console.log("companyId:", companyId);
  console.log("shopId:", shopId);

  return (
    <div>
      <MenuBar /> {/* Render the MenuBar component */}
      <DndProvider backend={HTML5Backend}>
        <SurveyEditor companyId={companyId} shopId={shopId} />
      </DndProvider>
    </div>
  );
};

export default SurveyEdit;