import { useLocation, useParams, useNavigate } from "react-router-dom";
import './Shops.css'; // CSSファイルをインポート
import { useEffect, useState } from "react";

const Shops = () => {
  const { companyId } = useParams();
  const navigate = useNavigate();

  // `state` から店舗情報を取得
  const location = useLocation();
  const { shops: initialShops } = location.state || {}; // 初期店舗情報
  const { companyname: companyName } = location.state || {}; // 

  const [shops, setShops] = useState(initialShops || []); // 店舗情報 state

  // 初回レンダリング時、または initialShops が更新された時にソートを実行
  useEffect(() => {
    if (initialShops) {
      const sortedShops = [...initialShops].sort((a, b) => {
        return a.shop_name.localeCompare(b.shop_name, 'ja'); // 日本語の文字コード順に比較
      });
      setShops(sortedShops);
    }
  }, [initialShops]);

  console.log("companyName", companyName)
  console.log("RRRRRRRR", location)
  console.log("UUUUUUUU", shops)

  return (
    <div className="shops-container">
      <h1 className="title"> {companyName} 店舗一覧</h1>

      {/* 店舗がない場合のメッセージ */}
      {shops && shops.length === 0 ? (
        <p className="no-shops-message">この企業には店舗が登録されていません。</p>
      ) : (
        <div className="shops-list">
          {shops && shops.map((shop) => (
            <button
              key={shop.shop_id}
              className="shop-button"
              onClick={() =>
                navigate(`/survey-app/dashboard/${companyId}/${shop.shop_id}`, {
                  state: { shopName: shop.shop_name}
                })
              }
              aria-label={`${shop.shop_name}のダッシュボードに移動`}
            >
              <div className="shop-info">
                <div className="shop-details">
                  <h2>{shop.shop_name}</h2>
                  <p>📍 {shop.shop_location}</p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Shops;