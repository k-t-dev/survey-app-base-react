import { useState, useEffect } from "react";
import { useDrag, useDrop } from "react-dnd";
import "./SurveyEditor.css";

const SurveyEditor = ({ companyId, shopId }) => {
  const [google_review_link, setgoogle_review_link] = useState("");
  const [survey, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSurveyData = async () => {
      try {
        const response = await fetch(`https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/survey/${companyId}/${shopId}`);
        if (!response.ok) throw new Error("アンケートデータの取得に失敗しました");

        const data = await response.json();

        if (data.length === 0) {
          alert("質問内容を保存してください");
          setQuestions([]);
          setgoogle_review_link("");
          return;
        }

        const groupedQuestions = {};

        data
          .sort((a, b) => a.question_order - b.question_order) // question_order順に並べる
          .forEach((item) => {
            if (!groupedQuestions[item.question_id]) {
              groupedQuestions[item.question_id] = {
                id: item.question_id,
                text: item.question,
                options: [],
                first_question: item.first_question,
              };
            }

            const option = item.first_question
              ? {
                  text: item.answer,
                  type: item.judge || "custom",
                  order: item.answer_order || 999,
                }
              : {
                  text: item.answer,
                  order: item.answer_order || 999,
                };

            groupedQuestions[item.question_id].options.push(option);
          });

        const sortedQuestions = Object.values(groupedQuestions).map((q) => ({
          ...q,
          options: q.options
            .sort((a, b) => (a.order || 0) - (b.order || 0))
            .map((opt) => (q.first_question ? { text: opt.text, type: opt.type } : opt.text)),
        }));

        setQuestions(sortedQuestions);
        setgoogle_review_link(data[0]?.google_review_link || "");
      } catch (err) {
        console.error(err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (companyId && shopId) {
      fetchSurveyData();
    }
  }, [companyId, shopId]);

  const addQuestion = () => {
    if (survey.length >= 10) return;
    setQuestions([
      ...survey,
      {
        id: Date.now(),
        text: "",
        options: [],
        first_question: survey.length === 0,
      },
    ]);
  };

  const updateQuestionText = (id, newText) => {
    setQuestions(survey.map(q => q.id === id ? { ...q, text: newText } : q));
  };

  const addOption = (id) => {
    setQuestions(survey.map(q =>
      q.id === id
        ? {
            ...q,
            options: [...q.options, q.first_question ? { text: "", type: "custom" } : ""],
          }
        : q
    ));
  };

  const updateOption = (qId, index, newValue) => {
    setQuestions(survey.map(q =>
      q.id === qId
        ? {
            ...q,
            options: q.options.map((opt, i) =>
              i === index ? (q.first_question ? { ...opt, text: newValue } : newValue) : opt
            ),
          }
        : q
    ));
  };

  const updateOptionType = (qId, index, newType) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === qId && q.first_question
          ? {
              ...q,
              options: q.options.map((opt, i) =>
                i === index ? { ...opt, type: newType } : opt
              ),
            }
          : q
      )
    );
  };

  const removeOption = (qId, index) => {
    setQuestions(survey.map(q =>
      q.id === qId
        ? { ...q, options: q.options.filter((_, i) => i !== index) }
        : q
    ));
  };

  const removeQuestion = (id) => {
    if (survey.length > 1) {
      setQuestions(survey.filter(q => q.id !== id));
    }
  };

  const saveSurvey = async () => {
    const confirmed = window.confirm("本当に保存しますか？");
    if (!confirmed) return;


    const displayedSurvey = [...survey].sort(
      (a, b) => (b.first_question ? 1 : 0) - (a.first_question ? 1 : 0)
    );

    const formattedSurvey = displayedSurvey.map((q, idx) => {
      const answers = {};
      const judges = {};

      q.options.forEach((opt, index) => {
        const key = (index + 1).toString();
        if (q.first_question) {
          answers[key] = opt.text;
          judges[key] = opt.type;
        } else {
          answers[key] = opt;
          judges[key] = "";
        }
      });

      return {
        question_order: idx + 1,
        question: q.text,
        answer: answers,
        first_question: q.first_question ? "True" : "False",
        judge: judges,
      };
    });


    const payload = {
      shop_id: shopId,
      google_review_link,
      survey: formattedSurvey,
    };

    console.log(payload)

    try {
      const response = await fetch(`https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/survey/`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        alert(`更新に成功しました。`);
      } else {
        alert(`更新に失敗しました。`);
      }
    } catch (error) {
      console.error("Error saving survey:", error);
      alert(`更新に失敗しました。`);
    }
  };

  const moveOption = (qId, fromIndex, toIndex) => {
    setQuestions(prev =>
      prev.map(q => {
        if (q.id === qId) {
          const options = [...q.options];
          const [moved] = options.splice(fromIndex, 1);
          options.splice(toIndex, 0, moved);
          return { ...q, options };
        }
        return q;
      })
    );
  };

  if (loading) return <div>読み込み中...</div>;
  if (error) return <div>エラー: {error}</div>;

  return (
    <div className="survey-editor-container">
      <h1>アンケート編集</h1>

      <div className="google-url">
        <h3>GoogleマイビジネスURL</h3>
        <input
          type="text"
          value={google_review_link}
          onChange={(e) => setgoogle_review_link(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="questions-area">
        <h3>アンケート項目（{survey.length}/10）</h3>
        {[...survey]
          .sort((a, b) => (b.first_question ? 1 : 0) - (a.first_question ? 1 : 0))
          .map((q, index) => (
            <div key={q.id} className="question-card">
              <h4>
                質問 {index + 1}
                {index > 0 && (
                  <button onClick={() => removeQuestion(q.id)} className="remove-question-btn">
                    削除
                  </button>
                )}
              </h4>
              <input
                type="text"
                value={q.text}
                onChange={(e) => updateQuestionText(q.id, e.target.value)}
                placeholder="質問文を入力"
                className="input-field question-input"
              />
              <h5>選択肢</h5>
              {q.options.map((opt, i) => (
                <div key={i} className="option-container">
                  <div className="drag-icon">
                    <DragOption
                      qId={q.id}
                      index={i}
                      option={q.first_question ? opt.text : opt}
                      moveOption={moveOption}
                    />
                  </div>
                  <input
                    type="text"
                    value={q.first_question ? opt.text : opt}
                    onChange={(e) => updateOption(q.id, i, e.target.value)}
                    className="input-field option-input"
                  />
                  {q.first_question && (
                    <select
                      value={opt.type}
                      onChange={(e) => updateOptionType(q.id, i, e.target.value)}
                      className="option-type-select"
                    >
                      <option value="custom">独自アンケート</option>
                      <option value="google">Googleアンケート</option>
                    </select>
                  )}
                  <button onClick={() => removeOption(q.id, i)} className="remove-option-btn">
                    削除
                  </button>
                </div>
              ))}
              <button onClick={() => addOption(q.id)} className="add-option-btn">
                選択肢を追加
              </button>
            </div>
          ))}
        <button
          onClick={addQuestion}
          disabled={survey.length >= 10}
          className="add-question-btn"
        >
          質問を追加
        </button>
      </div>

      <div className="save-btn-container">
        <button onClick={saveSurvey} className="save-btn">
          保存する
        </button>
      </div>
    </div>
  );
};

const DragOption = ({ qId, index, option, moveOption }) => {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "option",
    item: { qId, index },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
  }));

  const [, drop] = useDrop(() => ({
    accept: "option",
    hover: (item) => {
      if (item.index !== index) {
        moveOption(item.qId, item.index, index);
        item.index = index;
      }
    },
  }));

  return (
    <div ref={(node) => drag(drop(node))} className={`drag-option ${isDragging ? "dragging" : ""}`}>
      &#8597;
    </div>
  );
};

export default SurveyEditor;
