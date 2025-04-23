import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import EditCompanies from "./pages/EditCompanies";
import Home from "./pages/Home";
import Shops from "./pages/Shops";
import Dashboard from "./pages/Dashboard";
import SurveyEdit from "./pages/SurveyEdit";

import SurveyPage from "./pages/SurveyPage";
import SurevyCommentPage from "./pages/SurevyCommentPage";
import SurveyLink from "./pages/SurveyLinkPage";

function App() {

  //Set API Key here
  return (
    <Router>
      <Routes>
        <Route path="/survey-app/home" element={<Home />} />
        <Route path="/survey-app/edit-companies" element={<EditCompanies />} />
        <Route path="/survey-app/:companyId/shops/" element={<Shops />} />
        <Route path="/survey-app/dashboard/:companyId/:shopId" element={<Dashboard />} />
        <Route path="/survey-app/survey-edit/:companyId/:shopId" element={<SurveyEdit />} />
        <Route path="/survey-app/survey-preview/:companyId/:shopId" element={<SurveyPage />} />
        <Route path="/survey-app/survey-preview/comment/:companyId/:shopId" element={<SurevyCommentPage />} />
        <Route path="/survey-app/survey-link/:companyId/:shopId" element={<SurveyLink />} />

      </Routes>
    </Router>
  );
}

export default App;
