import React, { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation, useParams } from 'react-router-dom';
import './Dashboard.css';

const MenuBar = () => {
  const location = useLocation();
  const { companyId, shopId } = useParams();
  const [shopName, setShopName] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchShopName = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/shops'); // Fetch the list of all shops
        if (!response.ok) {
          const message = `HTTP error! status: ${response.status}`;
          throw new Error(message);
        }
        const data = await response.json();
        
        // Find the shop with the matching shopId
        const currentShop = data.find(shop => shop.shop_id === shopId);

        if (currentShop) {
          setShopName(currentShop.shop_name);
        } else {
          setError(`店舗ID ${shopId} の情報が見つかりませんでした`);
        }
      } catch (err) {
        setError("店舗情報の取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (shopId) {
      fetchShopName();
    } else {
      setShopName("店舗情報取得中...");
      setLoading(false);
    }
  }, [shopId]);

  const menuItems = [
    { to: `/survey-app/dashboard/${companyId}/${shopId}`, label: 'ダッシュボード' },
    { to: `/survey-app/survey-edit/${companyId}/${shopId}`, label: 'アンケート編集' },
    { to: `/survey-app/survey-preview/${companyId}/${shopId}`, label: 'アンケートプレビュー' },
    // 他のメニュー項目もここに追加できる
  ];

  if (loading) {
    return <div>店舗情報を読み込み中...</div>;
  }

  if (error) {
    return <div>エラーが発生しました: {error}</div>;
  }

  return (
    <div className="menu-bar">
      {shopName && <h3 className="shop-name">{shopName}</h3>}
      <h2 className="menu-title">メニュー</h2>
      <ul className="menu-list">
        {menuItems.map((item) => (
          <li key={item.label} className={location.pathname === item.to ? 'active' : ''}>
            <Link to={item.to}>{item.label}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default MenuBar;