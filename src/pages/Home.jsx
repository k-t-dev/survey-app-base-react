import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import './Home.css'; // CSSファイルをインポート

const Home = () => {
  const navigate = useNavigate();
  const [companies, setCompanies] = useState([]); // 企業データ
  const [shops, setShops] = useState([]); // 店舗データ
  const [loading, setLoading] = useState(true); // ローディング状態
  const [error, setError] = useState(""); // エラーメッセージ

  // useEffect でデータを非同期に取得
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [companiesResponse, shopsResponse] = await Promise.all([
          axios.get("https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/companies"),
          axios.get("https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/shops")
        ]);

        // 取得した企業名をアルファベット順にソート
        const sortedCompanies = [...companiesResponse.data].sort((a, b) => {
          return a.company_name.localeCompare(b.company_name, 'ja'); // 日本語の文字コード順に比較
        });
        setCompanies(sortedCompanies);
        setShops(shopsResponse.data);
      } catch (err) {
        setError("データの取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []); // 初回レンダリング時のみ実行

  if (loading) {
    return <div>データを読み込んでいます...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="home-container">
      <h1 className="title">企業一覧</h1>

      {/* 企業一覧ボタン */}
      <div className="companies-list">
        {companies.map((company) => {
          const relatedShops = shops.filter(shop => shop.company_id === company.company_id);
          return (
            <button
              key={company.company_id}
              className="company-button"
              onClick={() => navigate(`/survey-app/${company.company_id}/shops/`, { state: { shops: relatedShops, companyname:company.company_name } })}
              aria-label={`企業ページへ移動: ${company.company_name}`}
            >
              {company.company_name}
            </button>
          );
        })}
      </div>

      {/* 登録情報編集ボタン */}
      <div className="edit-button-container">
        <button
          className="edit-button"
          onClick={() => navigate("/survey-app/edit-companies")}
          aria-label="登録情報の編集"
        >
          登録情報の編集と登録
        </button>
      </div>
    </div>
  );
};

export default Home;