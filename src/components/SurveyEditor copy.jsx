import { useState } from "react";
import { useDrag, useDrop } from "react-dnd";
import "./SurveyEditor.css";

const SurveyEditor = ({ companyId, shopId }) => {

  console.log("companyId IN editer",companyId);
  console.log("shopId IN editer",shopId);

  
  const [googleUrl, setGoogleUrl] = useState("https://business.google.com/...");
  const [questions, setQuestions] = useState([
    {
      id: 1,
      type: "radio",
      text: "当店を知ったきっかけを教えてください",
      options: [
        { text: "インターネット検索", type: "custom" },
        { text: "SNS", type: "custom" },
        { text: "友人・知人の紹介", type: "custom" },
        { text: "チラシ・広告", type: "custom" },
        { text: "その他", type: "custom" },
      ],
    },
    {
      id: 2,
      type: "radio",
      text: "サービスの満足度を教えてください",
      options: ["とても満足", "満足", "普通", "やや不満", "不満"],
    },
  ]);

  const addQuestion = () => {
    if (questions.length >= 10) return;
    setQuestions([
      ...questions,
      { id: Date.now(), type: "radio", text: "", options: [] },
    ]);
  };

  const updateQuestionText = (id, newText) => {
    setQuestions(questions.map(q => q.id === id ? { ...q, text: newText } : q));
  };

  const addOption = (id) => {
    setQuestions(questions.map(q =>
      q.id === id
        ? {
            ...q,
            options: [...q.options, q.id === 1 ? { text: "", type: "custom" } : ""],
          }
        : q
    ));
  };

  const updateOption = (qId, index, newValue) => {
    setQuestions(questions.map(q =>
      q.id === qId
        ? {
            ...q,
            options: q.options.map((opt, i) =>
              i === index ? (qId === 1 ? { ...opt, text: newValue } : newValue) : opt
            ),
          }
        : q
    ));
  };

  const updateOptionType = (index, newType) => {
    setQuestions(prev =>
      prev.map(q =>
        q.id === 1
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
    setQuestions(questions.map(q =>
      q.id === qId
        ? { ...q, options: q.options.filter((_, i) => i !== index) }
        : q
    ));
  };

  const removeQuestion = (id) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const saveSurvey = () => {
    const payload = {
      companyId,
      shopId,
      googleUrl,
      questions,
    };
    console.log("保存するデータ:", payload);
    alert("アンケートが保存されました！");
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

  return (
    <div className="survey-editor-container">
      <h1>アンケート編集</h1>

      <div className="google-url">
        <h3>GoogleマイビジネスURL</h3>
        <input
          type="text"
          value={googleUrl}
          onChange={(e) => setGoogleUrl(e.target.value)}
          className="input-field"
        />
      </div>

      <div className="questions-area">
        <h3>アンケート項目（{questions.length}/10）</h3>
        {questions.map((q, index) => (
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
                    option={q.id === 1 ? opt.text : opt}
                    moveOption={moveOption}
                  />
                </div>
                <input
                  type="text"
                  value={q.id === 1 ? opt.text : opt}
                  onChange={(e) => updateOption(q.id, i, e.target.value)}
                  className="input-field option-input"
                />
                {q.id === 1 && (
                  <select
                    value={opt.type}
                    onChange={(e) => updateOptionType(i, e.target.value)}
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
          disabled={questions.length >= 10}
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
