import { useState, useEffect } from "react";
import axios from "axios";
import Modal from "react-modal";
import { CSVLink } from "react-csv";
import './EditCompanies.css';


// モーダルのアクセシビリティ設定
Modal.setAppElement("#root");

const ManageInfo = () => {

  const companyTableColumns = { 会社名: "", 会社住所: "", メールアドレス: "", 代表者: "", メモ: "" };
  const shopTableColumns = { 店舗名: "", 店舗住所: "", メールアドレス:"", 代表者:"", 契約開始日: "", 契約終了日: "", 担当者:"", メモ:""};
  // const shopTableColumns = { 店舗名: "", 店舗住所: "", メールアドレス:"", 代表者:"", 契約開始日: "", 契約終了日: "", 担当者:"", アンケートリンク: "", Google評価リンク: "" , メモ:""};
  const [viewMode, setViewMode] = useState("company");
  const [editingCompany, setEditingCompany] = useState(null);
  const [editingShop, setEditingShop] = useState(null);

  const [newCompanyData, setNewCompanyData] = useState(companyTableColumns);
  const [newShopData, setNewShopData] = useState(shopTableColumns);
  const [isCompanyModalOpen, setIsCompanyModalOpen] = useState(false);
  const [isShopModalOpen, setIsShopModalOpen] = useState(false);
  const [shopAddTargetIndex, setShopAddTargetIndex] = useState(null); // 新規店舗追加先の企業インデックス

  const [companies, setCompanies] = useState([]);
  const [shops, setShops] = useState([]);
  
  const [loading, setLoading] = useState(true); // Optional: ローディング状態管理
  const [error, setError] = useState(null);     // Optional: エラーハンドリング

  console.log("shops", shops)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // 並行して複数のAPIを呼び出し
        const [companiesResponse, shopsResponse] = await Promise.all([
          axios.get("https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/companies"),
          axios.get("https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/shops")
        ]);
        
        // 取得したデータをそれぞれのステートに保存
        setCompanies(companiesResponse.data);
        setShops(shopsResponse.data);
        console.log("shopsResponse", shopsResponse)
      } catch (err) {
        setError("データの取得に失敗しました");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);


  if (loading) return <p>読み込み中...</p>;
  if (error) return <p>{error}</p>;

  // console.log('companies',companies)
  // console.log('shops',shops)


  ////  ~~~~~~~~~~~~~~~~~~~~ 企業 ~~~~~~~~~~~~~~~~~~~~

  const handleEditCompanyModalContents = (index) => {
    // Get the company data at the given index
    const companyToEdit = companies[index];
    //UI 表示のため
    const mappedCompanyForUI = {
      "会社名": companyToEdit.company_name,
      "会社住所": companyToEdit.company_address,
      "メールアドレス": companyToEdit.company_contact_address,
      "代表者": companyToEdit.company_owner_name,
      "メモ": companyToEdit.remarks,
    };
    setEditingCompany({ ...mappedCompanyForUI, index });
    setIsCompanyModalOpen(true);
  };

  //既存企業の削除
  const handleDeleteCompany = async (index) => {
    const company = companies[index];
    const isConfirmed = window.confirm(`${company.company_name} を本当に削除しますか？`);

    if (isConfirmed) {
      try {
        // Set the contract to 'cancel'
        // console.log("####company###", company)
        company.contract = 'cancel';

        // TODO Make the API request to delete the company
        const response = await fetch(`https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/company/temp_status_changes/${company.company_id}/${company.contract}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        if (response.ok) {
          // If successful, remove the company from the local state
          setCompanies(companies.filter((_, i) => i !== index));
          alert(`企業（${company.company_name}）が削除されました`);
        } else {
          // Handle error if the API request fails
          alert(`企業（${company.company_name}）の削除に失敗しました`);
        }
      } catch (error) {
        // Handle network error
        console.error("Error deleting company:", error);
        alert("ネットワークエラーが発生しました");
      }
    }
  };


const resetCompanyData = () => {
  setNewCompanyData({...companyTableColumns}); // スプレッド構文でプロパティを展開
};


  //既存企業の編集
  const handleEditCompany = async () => {
    const updatedCompanies = [...companies];
    // Filter and update the company by its index
    const updatedCompany = { ...editingCompany };  // Create a copy of the editing company object
    const current_index = updatedCompany.index
    const company = updatedCompanies[current_index];

    const updatedCompanyPayload = {
      company_name: updatedCompany.会社名,
      company_address: updatedCompany.会社住所,
      company_contact_address: updatedCompany.メールアドレス,
      company_owner_name: updatedCompany.代表者,
      remarks: updatedCompany.メモ,
    };
    updatedCompanyPayload.contract = 'contract';

    // console.log('updatedCompanies', updatedCompanies);
    // console.log('company', company);
    // console.log('updatedCompany', updatedCompany);
    // console.log('updatedCompanyPayload', updatedCompanyPayload);

    // Make the API request to save the updated companies
    try {
      const companyId = company.company_id;
      const response = await fetch(`https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/company/${companyId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedCompanyPayload),
      });

      // console.log('response',response)

      if (response.ok) {
        // Assuming the response returns a success status
        delete updatedCompanyPayload.contract;
        const updatedList = [...companies];
        updatedList[updatedCompany.index] = {...updatedList[updatedCompany.index], ...updatedCompanyPayload,};

        setCompanies(updatedList);
        setEditingCompany(null);
        setIsCompanyModalOpen(false);
        alert(`${updatedList.company_name}の更新に成功しました。`);
      } else {
        alert(`${updatedCompanyPayload.company_name}の更新に失敗しました。`);
      }
    } catch (error) {
      console.error('Error saving company data:', error);
      alert(`${updatedCompanyPayload.company_name}の更新に失敗しました。`);
    }
  };
  
  //新規企業の追加
  const handleAddCompany = async () => {
      // 会社名が空かどうかを確認
    if (!newCompanyData.会社名) {
      alert("会社名は必須です。");
      return; // 会社名がない場合は処理を中断
    }
    // Map front-end keys to API keys
    const mappedCompany = {
      company_name: newCompanyData.会社名,
      company_address: newCompanyData.会社住所,
      company_contact_address: newCompanyData.メールアドレス,
      company_owner_name: newCompanyData.代表者,
      remarks: newCompanyData.メモ,
    };

    try {
      // console.log("mappedCompany", mappedCompany); // Logs the object with the new keys
      // API call to add the new company
      const response = await fetch('https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedCompany),
      });

      // console.log("##--companies", companies);
  
      if (!response.ok) {
        throw new Error('Failed to add company');
      }
  
      // Update the local state after the company has been successfully added
      const addedCompany = await response.json(); // Assuming the API returns the added company data
      


      setCompanies([...companies, addedCompany]);
  
      // Reset the form and close the modal
      // setNewCompanyData({ ...companyTableColumns });

      // console.log("!!!addedCompany!!!", addedCompany);
      // console.log("##--companies--##", companies);

      // close the modal
      setIsCompanyModalOpen(false);

      alert("保存が成功しました。");
  
    } catch (error) {
      console.error('Error adding company:', error);
      alert('企業の追加に失敗しました');
    }
  };

////  ~~~~~~~~~~~~~~~~~~~~ 店舗 ~~~~~~~~~~~~~~~~~~~~

  //新規店舗の追加
  const handleAddShop = async () => {

    // console.log('!!companies!!', companies);
    // console.log('!!shopAddTargetIndex!!', shopAddTargetIndex); // company index
    // console.log('!!shopAddTargetIndex!!', companies[shopAddTargetIndex]);
    // console.log('!!newShopData!!', newShopData);

    if (!newShopData.店舗名 || !newShopData.契約開始日 || !newShopData.契約終了日) {
      alert("店舗名、契約開始日、契約終了日は必須です。");
      return; // 必須項目が未入力の場合は処理を中断
    }

    const relating_company_id = companies[shopAddTargetIndex].company_id;
    // console.log('!!relating_company_id!!', relating_company_id);

    // TODO Map front-end keys to API keys
    const mappedShop = {
      shop_name: newShopData.店舗名,
      shop_owner_name: newShopData.代表者,
      shop_contact_address: newShopData.メールアドレス,
      shop_location: newShopData.店舗住所,
      start_contract_date: newShopData.契約開始日,
      end_contract_date: newShopData.契約終了日,
      in_charge: newShopData.担当者,
      remarks: newShopData.メモ
    };

    try {
      // console.log("INSERT relating_company_id", relating_company_id); 
      // console.log("INSERT mappedShop", mappedShop); // Logs the object with the new keys

      // API call to add the new shop
      const response = await fetch(`https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/shop/${relating_company_id}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(mappedShop),
      });
  
      if (!response.ok) {
        throw new Error('Failed to add shop');
      }

      //リターンでデータの受け取りと、追加
      const addedShops = await response.json(); // Assuming the API returns the added company data
      // console.log("!!!addedShops!!!", addedShops);
      // console.log("!!!--shops--!!!", shops);

      const shop_id_for_link = addedShops.shop_id

      // console.log("!!!--shop_id_for_link--!!!", shop_id_for_link);
      const link_response = await fetch(`https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/survey-link/${relating_company_id}/${shop_id_for_link}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });
    

      if (!link_response.ok) {
        throw new Error('Failed to add shop');
      }

      const addedSurveyLink = await link_response.json();

      addedShops.survey_link = addedSurveyLink.survey_link

      // console.log("!!survey_link!!", addedShops.survey_link)

      // ローカル状態に新店舗を追加
      setShops([...shops, addedShops]);
      
      // 追加後新たに追加するときに、追加項目を準備
      setNewShopData({ ...shopTableColumns });

      //モーダルを削除
      setIsShopModalOpen(false);

      alert("保存が成功しました。");
  
    } catch (error) {
      console.error('Error adding shop:', error);
      alert('企業の追加に失敗しました');
    }
  };


  //既存店舗の削除
  const handleDeleteShop = async (companyIndex, shop_id) => {
    const company = companies[companyIndex];//会社の指定
    const shopInCompany = shops.find(shop => shop.company_id === company.company_id && shop.shop_id === shop_id);;//ショップの指定
    // console.log("@@company",company)
    // console.log("@@shopInCompany",shopInCompany)

    const isConfirmed = window.confirm(`${shopInCompany.shop_name} を本当に削除しますか？`);

    if (isConfirmed) {
      try {
        // Set the contract to 'cancel'
        // console.log("@@DELETE shop", shopInCompany)
        shopInCompany.contract = 'cancel';

        // TODO Make the API request to delete the company /shop/temp_status_changes/{company_id}/{shop_id}/{contract}
        const response = await fetch(`https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/shop/temp_status_changes/${shopInCompany.company_id}/${shopInCompany.shop_id}/${shopInCompany.contract}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          }
        });

        // console.log("@@DELETE shop response", response)

        if (response.ok) {
          setShops(shops.filter(shop => shop.shop_id !== shop_id));
          alert(`${company.company_name}）の店舗（${shopInCompany.shop_name}）が削除されました。`);
        } else {
          // Handle error if the API request fails
          alert(`${company.company_name}）の店舗（${shopInCompany.shop_name}）の削除に失敗しました。`);
        }
      } catch (error) {
        // Handle network error
        console.error("Error deleting company:", error);
        alert("ネットワークエラーが発生しました");
      }
    }
  };

  //既存店舗の編集項目表示
  const handleEditShopModalContents = (companyIndex, shop_id) => {

    // console.log('!!!companyIndex!!!', companyIndex)
    // console.log('!!!shop_id!!!', shop_id)
    const company = companies[companyIndex];//会社の指定
    const company_id = company.company_id
    const shopToEdit = shops.find(shop => shop.company_id === company_id && shop.shop_id === shop_id);;//ショップの指定

    //UI 表示のため
    const mappedShopForUI = {
      "店舗名": shopToEdit.shop_name,
      "店舗住所": shopToEdit.shop_location,
      "メールアドレス": shopToEdit.shop_contact_address,
      "代表者": shopToEdit.shop_owner_name,
      "契約開始日": shopToEdit.start_contract_date,
      "契約終了日": shopToEdit.end_contract_date,
      "担当者": shopToEdit.in_charge,
      "メモ": shopToEdit.remarks
    };
    setEditingShop({ ...mappedShopForUI, shop_id, company_id});

    // console.log('RRRR', mappedShopForUI)
    setIsShopModalOpen(true);
  };

  //　既存店舗の編集
  const handleEditShop = async () => {

    const company_id = editingShop.company_id
    const shop_id = editingShop.shop_id
    const index = shops.findIndex(
      shop => shop.company_id === company_id && shop.shop_id === shop_id
    );
    // console.log('!!!index!!!', index)

    const updatedShop = { ...editingShop, index};

    const updatedShopPayload = {
      shop_name: updatedShop.店舗名,
      shop_location: updatedShop.店舗住所,
      shop_contact_address: updatedShop.メールアドレス,
      shop_owner_name: updatedShop.代表者,
      start_contract_date: updatedShop.契約開始日,
      end_contract_date: updatedShop.契約終了日,
      in_charge: updatedShop.担当者,
      remarks: updatedShop.メモ,
    };

    try {
      const response = await fetch(`https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/shop/${company_id}/${shop_id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedShopPayload),
      });
      // console.log('@@response@@', response)

      if (response.ok) {
        // console.log('##########', updatedShop)
        // 更新対象だけを更新する
        setShops(prevShops => {
          const newShops = [...prevShops];
          newShops[index] = { ...newShops[index], ...updatedShopPayload };
          return newShops;
        });
        // console.log('######rr####', response)
        setEditingShop(null);
        setIsShopModalOpen(false);
        alert(`${updatedShopPayload.shop_name}の更新に成功しました。`);
      } else {
        alert(`${updatedShopPayload.shop_name}の更新に失敗しました。`);
      }
    } catch (error) {
      console.error('Error saving shop data:', error);
      alert(`${updatedShopPayload.shop_name}の更新に失敗しました。`);
    }
  };

  

  // ~~~~~~~~~~~~~~~~~~~~ HTML ~~~~~~~~~~~~~~~~~~~~
  return (
    <div style={{ maxWidth: "90%", margin: "0 auto", padding: "20px", fontFamily: "'Arial', sans-serif", color: "#333" }}>
      
    {/* ホームに戻るボタン */}
    <div className="back-button-wrapper">
      <a href="/survey-app/home" className="back-button">
        →ホームに戻る
      </a>
    </div>

      <h1 style={{ textAlign: "center", color: "#007bff" }}>企業および店舗情報の管理</h1>

      {/* ビューモード切り替え */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
        <button onClick={() => setViewMode("company")} style={{ padding: "10px 20px", marginRight: "10px", backgroundColor: viewMode === "company" ? "#007bff" : "#f8f9fa", border: "1px solid #007bff", borderRadius: "5px", cursor: "pointer" }}>
          企業情報
        </button>
        <button onClick={() => setViewMode("shop")} style={{ padding: "10px 20px", backgroundColor: viewMode === "shop" ? "#007bff" : "#f8f9fa", border: "1px solid #007bff", borderRadius: "5px", cursor: "pointer" }}>
          店舗情報
        </button>
      </div>


      {/* 企業表示 */}
      {viewMode === "company" && (
        <>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>企業情報</h2>
          
          <div style={{ margin: "10px 0", textAlign: "right" }}>
            <CSVLink
              data={companies.map(company => ({
                会社名: company.company_name,
                会社住所: company.company_address,
                メールアドレス: company.company_contact_address,
                代表者: company.company_owner_name,
                メモ: company.remarks,
              }))}
              headers={[
                { label: "会社名", key: "会社名" },
                { label: "会社住所", key: "会社住所" },
                { label: "メールアドレス", key: "メールアドレス" },
                { label: "代表者", key: "代表者" },
                { label: "メモ", key: "メモ" },
              ]}
              filename="company_details.csv"
              style={{ padding: "10px 20px", backgroundColor: "#17a2b8", color: "#fff", borderRadius: "5px", textDecoration: "none" }}
            >
              CSV出力
          </CSVLink>
        </div>

        <button
          onClick={() => {
            setEditingCompany(null);
            setIsCompanyModalOpen(true);
          }}
          style={{
            padding: "10px 20px",
            backgroundColor: "#ffffff",        // 白背景
            color: "#007bff",                  // 青文字
            border: "2px solid #007bff",       // 青い枠線
            borderRadius: "5px",
            cursor: "pointer"
          }}
        >
          ＋新規企業追加
        </button>


          {/* 会社名でソート */}
          {companies
            .sort((a, b) => a.company_name.localeCompare(b.company_name)) // 会社名で昇順ソート
            .map((company, index) => (
              <div key={company.id} style={{ marginBottom: "20px" }}>

                <table border="1" style={{ width: "100%", borderCollapse: "collapse", marginTop: "10px", tableLayout: "fixed" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f1f1f1" }}>
                      <th style={{ width: "15%" }}>会社名</th>
                      <th style={{ width: "15%" }}>代表者の名前</th>
                      <th style={{ width: "25%" }}>会社住所</th>
                      <th style={{ width: "20%" }}>メールアドレス</th>
                      <th style={{ width: "15%" }}>メモ</th>
                      <th style={{ width: "10%" }}>アクション</th>
                    </tr>
                  </thead>
                  <tbody>
                  <tr>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{company.company_name}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{company.company_owner_name}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{company.company_address}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{company.company_contact_address}</td>
                    <td style={{ whiteSpace: "normal", wordBreak: "break-word" }}>{company.remarks}</td>
                    <td style={{ textAlign: "center" }}>
                      <button onClick={() => handleEditCompanyModalContents(index)} style={{ marginRight: "5px", backgroundColor: "#ffc107", padding: "5px 10px", borderRadius: "5px" }}>編集</button>
                      <button onClick={() => handleDeleteCompany(index)} style={{ backgroundColor: "#dc3545", padding: "5px 10px", borderRadius: "5px", color: "#fff" }}>削除</button>
                    </td>
                  </tr>
                  </tbody>
                </table>
              </div>
            ))}
            
        </>
      )}

      {/* 店舗表示 */}
      {viewMode === "shop" && (
        <>
          <h2 style={{ textAlign: "center", marginBottom: "20px" }}>店舗情報</h2>

          <div style={{ margin: "10px 0", textAlign: "right" }}>
          <CSVLink
            data={shops.map(shop => {
              const company = companies.find(c => c.company_id === shop.company_id);
              return {
                会社名: company?.company_name || "",
                店舗名: shop.shop_name,
                店舗住所: shop.shop_location,
                メールアドレス: shop.shop_contact_address,
                代表者: shop.shop_owner_name,
                契約開始日: shop.start_contract_date,
                契約終了日: shop.end_contract_date,
                担当者: shop.in_charge,
                メモ: shop.remarks,
                アンケートリンク: shop.survey_link,
                Google評価リンク: shop.google_review_link,
              };
            })}
            headers={[
              { label: "会社名", key: "会社名" },
              { label: "店舗名", key: "店舗名" },
              { label: "店舗住所", key: "店舗住所" },
              { label: "メールアドレス", key: "メールアドレス" },
              { label: "代表者", key: "代表者" },
              { label: "契約開始日", key: "契約開始日" },
              { label: "契約終了日", key: "契約終了日" },
              { label: "担当者", key: "担当者" },
              { label: "メモ", key: "メモ" },
              { label: "アンケートリンク", key: "アンケートリンク" },
              { label: "Google評価リンク", key: "Google評価リンク" },
            ]}
            filename="shops.csv"
            style={{ padding: "10px 20px", backgroundColor: "#17a2b8", color: "#fff", borderRadius: "5px", textDecoration: "none" }}
          >
            CSV出力
          </CSVLink>
        </div>


          {companies.map((company, companyIndex) => {
            // Filter shops by company_id
            const companyShops = shops.filter(shop => shop.company_id === company.company_id);

            return (
              <div key={company.id} style={{ marginBottom: "20px" }}>
                <h3>{company.company_name} の店舗情報</h3>
                <button
                  onClick={() => {
                    setShopAddTargetIndex(companyIndex);
                    setEditingShop(null);
                    setIsShopModalOpen(true);
                  }}
                  className="new-shop-button"
                >
                  ＋新規店舗追加
                </button>

                <table
                  border="1"
                  style={{
                    width: "100%",
                    marginTop: "10px",
                    borderCollapse: "collapse",
                    tableLayout: "fixed" // ← セル幅を固定
                  }}
                >
                  <thead>
                    <tr style={{ backgroundColor: "#f1f1f1" }}>
                      <th style={{ width: "10%" }}>店舗名</th>
                      <th style={{ width: "15%" }}>店舗住所</th>
                      <th style={{ width: "15%" }}>メールアドレス</th>
                      <th style={{ width: "10%" }}>代表者</th>
                      <th style={{ width: "10%" }}>契約開始日</th>
                      <th style={{ width: "10%" }}>契約終了日</th>
                      <th style={{ width: "10%" }}>担当者</th>
                      <th style={{ width: "10%" }}>メモ</th>
                      <th style={{ width: "20%" }}>アンケートリンク</th>
                      <th style={{ width: "20%" }}>Google評価リンク</th>
                      <th style={{ width: "10%" }}>アクション</th>
                    </tr>
                  </thead>
                  <tbody>
                    {companyShops.length > 0 ? (
                      companyShops.map((shop, shopIndex) => (
                        <tr key={shop.id}>
                          <td className="wrappable-cell">{shop.shop_name}</td>
                          <td className="wrappable-cell">{shop.shop_location}</td>
                          <td className="wrappable-cell">{shop.shop_contact_address}</td>
                          <td className="wrappable-cell">{shop.shop_owner_name}</td>
                          <td className="wrappable-cell">{shop.start_contract_date}</td>
                          <td className="wrappable-cell">{shop.end_contract_date}</td>
                          <td className="wrappable-cell">{shop.in_charge}</td>
                          <td className="wrappable-cell">{shop.remarks}</td>

                          <td className="link-cell" title={shop.survey_link}>
                          <a
                            href={shop.survey_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-text"
                          >
                            {shop.survey_link}
                          </a>
                        </td>

                        <td className="link-cell" title={shop.google_review_link}>
                          <a
                            href={shop.google_review_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="link-text"
                          >
                            {shop.google_review_link}
                          </a>
                        </td>


                          <td>
                            <button
                              onClick={() => handleEditShopModalContents(companyIndex, shop.shop_id)}
                              style={{
                                marginRight: "5px",
                                backgroundColor: "#ffc107",
                                padding: "5px 10px",
                                borderRadius: "5px"
                              }}
                            >
                              編集
                            </button>
                            <button
                              onClick={() => handleDeleteShop(companyIndex, shop.shop_id)}
                              style={{
                                backgroundColor: "#dc3545",
                                color: "#fff",
                                padding: "5px 10px",
                                borderRadius: "5px"
                              }}
                            >
                              削除
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="11" style={{ textAlign: "center" }}>店舗情報がありません</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            );
          })}
        </>
      )}


      {/* 企業モーダル */}
      <Modal isOpen={isCompanyModalOpen} onRequestClose={() => setIsCompanyModalOpen(false)} style={{ content: { maxWidth: "600px", margin: "auto" } }}>
        <h3>{editingCompany ? "企業情報を編集" : "新規企業を追加"}</h3>

        {(editingCompany ? Object.keys(editingCompany).filter(k => k !== "id" && k !== "shops" && k !== "index") : Object.keys(newCompanyData)).map(key => (
          <div key={key} style={{ marginBottom: "10px" }}>
            <label>{key}:</label>
            <input
              type="text"
              value={editingCompany ? editingCompany[key] : newCompanyData[key]}
              onChange={(e) =>
                editingCompany
                  ? setEditingCompany({ ...editingCompany, [key]: e.target.value })
                  : setNewCompanyData({ ...newCompanyData, [key]: e.target.value })
              }
              style={{ width: "100%" }}
            />
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={editingCompany ? handleEditCompany : handleAddCompany} style={{ backgroundColor: "#007bff", color: "#fff", padding: "10px 20px" }}>
            {editingCompany ? "保存" : "追加"}
          </button>

          <button onClick={() => { 
            setIsCompanyModalOpen(false); 
            resetCompanyData(); // Reset when cancelling
          }} style={{ backgroundColor: "#6c757d", color: "#fff", padding: "10px 20px" }}>
            キャンセル
          </button>
        </div>
      </Modal>
      
      {/* 店舗モーダル */}
      <Modal isOpen={isShopModalOpen} onRequestClose={() => setIsShopModalOpen(false)} style={{ content: { maxWidth: "600px", margin: "auto" } }}>
        <h3>{editingShop ? "店舗情報を編集" : "新規店舗を追加"}</h3>

        {(editingShop ? Object.keys(editingShop).filter(k => !["id", "companyIndex", "shopIndex", "shop_id", "company_id"].includes(k)) : Object.keys(newShopData)).map(key => (
          <div key={key} style={{ marginBottom: "10px" }}>
            <label>{key}:</label>

            <input
              type={["契約開始日", "契約終了日"].includes(key) ? "date" : "text"}
              value={editingShop ? editingShop[key] : newShopData[key]}
              onChange={(e) =>
                editingShop
                  ? setEditingShop({ ...editingShop, [key]: e.target.value })
                  : setNewShopData({ ...newShopData, [key]: e.target.value })
              }

              style={{ width: "100%" }}
            />
          </div>
        ))}

        <div style={{ display: "flex", justifyContent: "space-between" }}>
          <button onClick={editingShop ? handleEditShop : handleAddShop} style={{ backgroundColor: "#007bff", color: "#fff", padding: "10px 20px" }}>
            {editingShop ? "保存" : "追加"}
          </button>
          <button onClick={() => {
            setIsShopModalOpen(false);
            // resetShopData(); // Reset when cancelling
          }}style={{ backgroundColor: "#6c757d", color: "#fff", padding: "10px 20px" }}>
            キャンセル
            </button>
    
        </div>
      </Modal>
    </div>
  );
};

export default ManageInfo;
