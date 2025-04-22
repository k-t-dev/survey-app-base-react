import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { FaStar } from "react-icons/fa";
import './SurevyCommentPage.css';
import MenuBar from "./MenuBar"; // Import the MenuBar component

const SurevyCommentPage = () => {
  const { shopId } = useParams();
  const { companyId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  // `state` から取得 or `sessionStorage` から取得
  const [surveyData, setSurveyData] = useState(() => {
    const shopData = sessionStorage.getItem("surveyPayload");
    return location.state?.surveyPayload || (shopData ? JSON.parse(shopData) : {});
  });

  // surveyData の変更を監視してログを出力
  useEffect(() => {
    console.log("==== SUEVRY RECEIVED ====");
    console.log("Raw sessionStorage:", sessionStorage.getItem("surveyPayload"));
    console.log("Raw location.state:", location.state);
    console.log("Parsed surveyData:", surveyData);
    console.log("=========================");
  }, [surveyData]);


  const [review, setReview] = useState("");
  const [rating, setRating] = useState(0);

  const handleRating = (newRating) => setRating(newRating);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (rating === 0) {
      alert("評価を選択してください");
      return;
    }

    const formattedPayload = {
      shop_id: surveyData.shop_id,
      user_id: surveyData.user_id,
      answer_time: surveyData.answer_time, // JST タイムスタンプ
      results: [
        {
          // question_id: surveyData.results?.[0]?.question_id || "00000000-0000-0000-0000-000000000001",
          star: rating.toString(),
          comment: review.trim(),
        },
      ],
    };

    console.log("!!!!!!formattedPayload:!!!!!", formattedPayload);
    try {
      const response = await fetch(`https://dyhbv4khoh.execute-api.ap-northeast-1.amazonaws.com/dev/survey-results/comment/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formattedPayload),
      });

      if (!response.ok) throw new Error("レビュー送信に失敗しました");

      alert("ご回答ありがとうございました。");
      sessionStorage.removeItem("surveyPayload"); // 送信後に削除
      console.log("shopId",shopId)
      navigate(`/survey-app/survey-preview/${companyId}/${shopId}`);

    } catch (err) {
      console.error("送信エラー:", err);
      alert("送信エラーが発生しました。");
    }
  };

  const isSubmitDisabled = rating === 0; // Only disable if no rating is selected

  return (
    <div className="review-container">
      <MenuBar /> {/* Render the MenuBar component */}
      <h1>レビューを入力</h1>
      <p>星を選択してください<span style={{ color: 'red' }}>必須</span></p>
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            size={30}
            color={star <= rating ? "#FFD700" : "#ccc"}
            onClick={() => handleRating(star)}
            style={{ cursor: "pointer" }}
          />
        ))}
      </div>

      <p>この場所での体験や感想を共有してください。</p>
      <form onSubmit={handleSubmit}>
        <textarea
          value={review}
          onChange={(e) => setReview(e.target.value)}
          placeholder="ここにレビューを入力..."
          className="review-textarea"
        />

        <button
          type="submit"
          disabled={isSubmitDisabled}
          style={{
            backgroundColor: isSubmitDisabled ? "#ccc" : "#007bff",
            color: isSubmitDisabled ? "#666" : "white",
            padding: "10px 20px",
            fontSize: "16px",
            border: "none",
            cursor: isSubmitDisabled ? "not-allowed" : "pointer",
            opacity: isSubmitDisabled ? 0.6 : 1,
            transition: "background-color 0.3s ease, opacity 0.3s ease",
          }}
          // 念のため、onClickでnavigateが重複しないように削除
        >
          送信
        </button>

      </form>

      {/* デバッグ用に画面にも表示
      <div style={{ marginTop: "20px", padding: "10px", backgroundColor: "#f4f4f4", borderRadius: "5px" }}>
        <h3>デバッグ情報:</h3>
        <pre style={{ whiteSpace: "pre-wrap", wordBreak: "break-word" }}>
          {JSON.stringify(surveyData, null, 2)}
        </pre>
      </div> */}

    </div>
  );
};

export default SurevyCommentPage;