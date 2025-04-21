import { useParams, useNavigate } from "react-router-dom";
import './Stores.css'; // CSSファイルをインポート

const Stores = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();

  // 仮データ: API から取得することを想定
  const stores = [
    { id: 101, name: "店舗X", companyId: 1, address: "東京都千代田区1-1-1", surveyCount: 120 },
    { id: 102, name: "店舗Y", companyId: 1, address: "東京都渋谷区2-2-2", surveyCount: 85 },
    { id: 201, name: "店舗A", companyId: 2, address: "大阪府大阪市3-3-3", surveyCount: 45 },
    { id: 202, name: "店舗B", companyId: 2, address: "大阪府堺市4-4-4", surveyCount: 200 }
  ];

  // 選択した企業の店舗リストをフィルタリング
  const filteredStores = stores.filter((store) => store.companyId === Number(companyId));

  return (
    <div className="stores-container">
      <h1 className="title">店舗一覧</h1>

      {/* 店舗がない場合のメッセージ */}
      {filteredStores.length === 0 ? (
        <p className="no-stores-message">この企業には店舗が登録されていません。</p>
      ) : (
        <div className="stores-list">
          {filteredStores.map((store) => (
            <button
              key={store.id}
              className="store-button"
              onClick={() => navigate(`/survey-app/dashboard/${store.id}`)}
              aria-label={`${store.name}のダッシュボードに移動`}
            >
              <div className="store-info">
                <div className="store-details">
                  <h2>{store.name}</h2>
                  <p>📍 {store.address}</p>
                </div>
                <div className="survey-count">
                  アンケート: {store.surveyCount}件
                </div>
                <div className="arrow-icon">➡️</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Stores;
