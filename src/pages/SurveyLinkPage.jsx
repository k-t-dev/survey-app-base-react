import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import MenuBar from "./MenuBar"; // MenuBar コンポーネントをインポート
import "./SurveyLinkPage.css";

const SurveyLink = () => {
  const { companyId, shopId } = useParams();
  const [companyData, setCompanyData] = useState(null);
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSurveyLinks = async () => {
      setLoading(true);
      setError(null);
      try {
        const [companiesResponse, shopsResponse] = await Promise.all([
          axios.get("https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/companies"),
          axios.get("https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/shops"),
        ]);

        const filteredCompany = companiesResponse.data.find(
          (company) => company.company_id === companyId
        );
        const filteredShop = shopsResponse.data.find(
          (shop) => shop.shop_id === shopId
        );

        if (!filteredCompany || !filteredShop) {
          setError("指定された会社または店舗が見つかりませんでした");
        } else {
          setCompanyData(filteredCompany);
          setShopData(filteredShop);
        }
      } catch (err) {
        setError("データの取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (companyId && shopId) {
      fetchSurveyLinks();
    }
  }, [companyId, shopId]);

  const renderContent = () => {
    if (loading) {
      return <p>データを読み込み中...</p>;
    }

    if (error) {
      return <p className="error-message">{error}</p>;
    }

    if (!companyData || !shopData) {
      return <p>情報が見つかりませんでした。</p>;
    }

    return (
      <div className="survey-link-container">
        <h1 className="title">アンケートリンク</h1>

        <div className="info-section">
          <div className="company-info">
            <h2>会社情報</h2>
            <p>会社名: {companyData.company_name}</p>
            <p>会社住所: {companyData.company_address}</p>
          </div>

          <div className="company-info">
            <h2>店舗情報</h2>
            <p>店舗名: {shopData.shop_name}</p>
            <p>店舗住所: {shopData.shop_location}</p>
          </div>

          {shopData.google_review_link && (
            <div className="google-link-section">
              <h3>Googleリンク</h3>
              <a href={shopData.google_review_link} target="_blank" rel="noopener noreferrer">
                {shopData.google_review_link}
              </a>
            </div>
          )}

          {shopData.survey_link && (
            <div className="survey-link-section">
              <h3>アンケートリンク</h3>
              <a href={shopData.survey_link} target="_blank" rel="noopener noreferrer">
                {shopData.survey_link}
              </a>

              <div className="qr-code-container">
                <h4>アンケートリンクのQRコード</h4>
                <QRCodeCanvas value={shopData.survey_link} size={256} />
                <p>QRコードを保存するには、画像を右クリックして保存してください。</p>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="dashboard-layout">
      <MenuBar />
      <div className="dashboard-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default SurveyLink;
