import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { v4 as uuidv4 } from 'uuid';
import './SurveyPage.css';
import MenuBar from "./MenuBar"; // MenuBar コンポーネントをインポート

const SurveyPage = () => {
  const { shopId } = useParams();
  const { companyId } = useParams();
  const navigate = useNavigate();

  const [surveyData, setSurveyData] = useState([]);
  const [responses, setResponses] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [showPopup, setShowPopup] = useState(false);
  const [googleLink, setGoogleLink] = useState("");

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const response = await fetch(`https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/survey/${companyId}/${shopId}`);
        if (!response.ok) throw new Error("Failed to fetch survey data");
        const data = await response.json();

        // console.log("GET SURVEY DATA", data);

        // 質問ごとに選択肢をグループ化
        const groupedQuestions = {};
        data.forEach((item) => {
          if (!groupedQuestions[item.question_id]) {
            groupedQuestions[item.question_id] = {
              question_id: item.question_id,
              google_review_link: item.google_review_link,
              question: item.question,
              question_order: item.question_order,
              options: [],
              first_question: item.first_question,
            };
          }
          groupedQuestions[item.question_id].options.push({
            answer: item.answer,
            answer_id: item.answer_id,
            judge: item.judge,
            answer_order: item.answer_order,
          });
        });

        // 質問をquestion_orderでソートし、回答もanswer_orderでソート
        const sortedSurvey = Object.values(groupedQuestions)
          .sort((a, b) => a.question_order - b.question_order)
          .map((q) => ({
            ...q,
            options: q.options.sort((a, b) => a.answer_order - b.answer_order),
          }));

        setSurveyData(sortedSurvey);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchSurveyData();
  }, [shopId]);

  const handleOptionChange = (questionId, answerId) => {
    setResponses((prevResponses) => ({
      ...prevResponses,
      [questionId]: answerId,
    }));
  };

  const isFormComplete = surveyData.every((question) => responses[question.question_id]);
  const userId = uuidv4();

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isFormComplete) return;

    const surveyPayload = {
      shop_id: shopId,
      user_id: userId,
      answer_time: new Date().toLocaleString("ja-JP", { timeZone: "Asia/Tokyo" }),
      results: Object.entries(responses).map(([questionId, answerId]) => {
        const questionData = surveyData.find(q => q.question_id === questionId);
        const selectedAnswer = questionData.options.find(opt => opt.answer_id === answerId);
        return {
          question_id: questionId,
          answer_id: answerId,
          first_question: questionData.first_question ? "Yes" : "No",
          judge: questionData.first_question ? selectedAnswer.judge : undefined,
          google_review_link: questionData.google_review_link,
        };
      }),
    };

    try {
      const response = await fetch("https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/survey-results/general", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(surveyPayload),
      });

      if (!response.ok) throw new Error("Failed to submit survey data");

      // console.log("送信されたアンケートデータ:", surveyPayload);

      const firstQuestionResponse = surveyPayload.results.find(
        (res) => res.first_question === "Yes"
      );

      if (firstQuestionResponse) {
        if (firstQuestionResponse.judge === "google") {
          setGoogleLink(firstQuestionResponse.google_review_link);
          setShowPopup(true);
      
          // 3秒後に自動遷移
          setTimeout(() => {
            window.location.href = firstQuestionResponse.google_review_link;
          }, 3000);
          return;
        } else if (firstQuestionResponse.judge === "custom") {
          navigate(`/survey-app/survey-preview/comment/${companyId}/${shopId}`, { state: { surveyPayload } });
          return;
        }
      }

      navigate(`/survey-app/survey-preview/comment/${companyId}/${shopId}`, { state: { surveyPayload } });
    } catch (err) {
      console.error("送信エラー:", err);
    }
  };

  if (loading) return <p>Loading survey...</p>;
  if (error) return <p>Error: {error}</p>;

  return (
    <div className="survey-container">
      <MenuBar /> {/* MenuBar コンポーネントをレンダリング */}
      <h1>店舗アンケート</h1>
      <form onSubmit={handleSubmit} className="survey-form">

      {surveyData.map((question, index) => (
        <div key={question.question_id} className="question">
          <p><strong>{index + 1}.</strong> {question.question}</p>
          <div className="options">
            {question.options.map((option, i) => (
              <label key={i} className="option-label">
                <span className="option-text">{option.answer}</span>
                <input
                  type="radio"
                  name={`question-${question.question_id}`}
                  value={option.answer_id}
                  checked={responses[question.question_id] === option.answer_id}
                  onChange={() => handleOptionChange(question.question_id, option.answer_id)}
                />
              </label>
            ))}
          </div>
        </div>
      ))}


        <button
          type="submit"
          disabled={!isFormComplete}
          style={{
            backgroundColor: isFormComplete ? "#007bff" : "#ccc",
            color: isFormComplete ? "white" : "#666",
            padding: "10px 20px",
            fontSize: "16px",
            border: "none",
            cursor: isFormComplete ? "pointer" : "not-allowed",
            opacity: isFormComplete ? 1 : 0.6,
            transition: "background-color 0.3s ease, opacity 0.3s ease",
          }}
        >
          次へ
        </button>
      </form>

      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-content">
            <p>Googleで具体的な内容をお聞かせください。<br />※数秒後に自動的に遷移します</p>
            <button
              onClick={() => (window.location.href = googleLink)}
              className="popup-button"
            >
              Google投稿フォームへ
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SurveyPage;