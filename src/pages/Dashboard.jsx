import React, { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer
} from "recharts";
import "./Dashboard.css";
import MenuBar from "./MenuBar"; // MenuBar コンポーネントをインポート
import moment from "moment"; // Moment.js for easier date manipulation
import dayjs from 'dayjs';

const Dashboard = () => {
  const { companyId, shopId } = useParams();
  const [timeFrame, setTimeFrame] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [allData, setAllData] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true); // ローディング状態を追加
  const [error, setError] = useState(null); // エラー状態を追加
  const [feedbackData, setFeedbackData] = useState([]); // first_questionがtrueのデータを格納
  const [sortConfig, setSortConfig] = useState({ key: "answer_time", direction: "descending" }); // 初期ソート設定
  const [filters, setFilters] = useState({}); // フィルターの状態

  const [aggregationUnit, setAggregationUnit] = useState("day"); // ← これを追加！
  console.log("aggregationUnit:  ", aggregationUnit)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // データ取得開始時にローディングをtrueに
      setError(null); // エラー状態をリセット
      try {
        const response = await fetch(
          `https://0jdf7qckt2.execute-api.ap-northeast-1.amazonaws.com/dev/survey-results/${companyId}/${shopId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        // console.log("response", response);

        if (response.ok) {
          const data = await response.json();
          // console.log("Fetched Data:", data);
          setAllData(data);

          // Extract unique questions from the data
          const uniqueQuestions = {};
          data.forEach((item) => {
            if (!uniqueQuestions[item.question_id]) {
              uniqueQuestions[item.question_id] = {
                id: item.question_id,
                text: item.question,
                options: [],
              };
            }
            if (
              uniqueQuestions[item.question_id].options.indexOf(item.answer) ===
              -1
            ) {
              uniqueQuestions[item.question_id].options.push(item.answer);
            }
          });
          setQuestions(Object.values(uniqueQuestions));

          // Extract feedback data where first_question is true
          const feedback = data.filter((item) => item.first_question);

          const seen = new Set();
          const uniqueFeedback = feedback.filter(item => {
            const key = JSON.stringify(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          });

          setFeedbackData(uniqueFeedback);

        } else if (response.status === 404) {
          // データが存在しない場合
          setAllData([]);
          setQuestions([]);
          setFeedbackData([]);
        } else {
          console.error("サーバーエラー:", response.status);
          setError(`サーバーエラー: ${response.status}`);
        }
      } catch (error) {
        console.error("データ取得エラー:", error);
        setError("データの取得に失敗しました。");
      } finally {
        setLoading(false); // データ取得完了後にローディングをfalseに
      }
    };

    fetchData();
  }, [companyId, shopId]);


  // フィルターPart
  const timeFrameOptions = [
    { value: "3days", label: "📅 過去3日" },
    { value: "week", label: "📅 1週間" },
    { value: "month", label: "📅 1か月" },
    { value: "3months", label: "📅 3か月" },
    { value: "custom", label: "📅 期間指定" },
    { value: "all", label: "📅 全期間" },
  ];

  const aggregationOptions = [
    { value: "day", label: "日単位" },
    { value: "week", label: "週単位" },
    { value: "month", label: "月単位" },
    { value: "all", label: "全体" },
  ];

  const filterDataByTimeFrame = (data) => {
    let filteredData = data;
    const now = moment();

    switch (timeFrame) {
      case "3days":
        filteredData = data.filter(
          (item) => now.diff(moment(item.answer_time), "days") < 3
        );
        break;
      case "week":
        filteredData = data.filter(
          (item) => now.diff(moment(item.answer_time), "weeks") < 1
        );
        break;
      case "month":
        filteredData = data.filter(
          (item) => now.diff(moment(item.answer_time), "months") < 1
        );
        break;
      case "3months":
        filteredData = data.filter(
          (item) => now.diff(moment(item.answer_time), "months") < 3
        );
        break;
      case "custom":
        const start = moment(customStartDate);
        const end = moment(customEndDate).endOf("day"); // その日の最後の瞬間まで含める

        filteredData = data.filter(
          (item) =>
            moment(item.answer_time).isSameOrAfter(start) &&
            moment(item.answer_time).isSameOrBefore(end)
        );
        break;
      case "all":
      default:
        break;
    }
    
    return filteredData;
  };

  // フィルター　アンケートの棒グラフと円グラフPart
  const aggregateAnswers = (questionId) => {
    const filteredData = filterDataByTimeFrame(allData).filter(
      (item) => item.question_id === questionId
    );
    const aggregated = {};
    filteredData.forEach((response) => {
      aggregated[response.answer] = (aggregated[response.answer] || 0) + 1;
    });
    return Object.entries(aggregated).map(([option, count]) => ({
      option,
      count,
    }));
  };

  // フィルター　アンケート別の総回答数Part
  const prepareLineChartData = (questionId) => {
    const filteredData = filterDataByTimeFrame(allData).filter(
      (item) => item.question_id === questionId
    );

    if (aggregationUnit === "all") {
      return [{
        time: "全体",
        count: filteredData.length
      }];
    }

    // const timeGrouped = {};
    // filteredData.forEach((item) => {
    //   const date = moment(item.answer_time).format("YYYY-MM-DD"); // Group by day
    //   timeGrouped[date] = (timeGrouped[date] || 0) + 1;
    // });

    // aggregationUnitに応じたキーでグルーピング（週Filter 日曜日~土曜日、　　月Filter）
    const timeGrouped = {};
    filteredData.forEach((item) => {
      const dateKey = moment(item.answer_time).startOf(aggregationUnit).format("YYYY-MM-DD");
      timeGrouped[dateKey] = (timeGrouped[dateKey] || 0) + 1;
    });

    const aggByUserInput = Object.entries(timeGrouped)
    .sort((a, b) => new Date(a[0]) - new Date(b[0]))
    .map(([time, count]) => ({ time, count }));

    // const aggByUserInput =  Object.entries(timeGrouped)
    // .sort((a, b) => new Date(a[0]) - new Date(b[0])) // Sort by date
    // .map(([time, count]) => ({ time, count }));
    // console.log("aggByUserInput", aggByUserInput);

    return aggByUserInput

  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  // フィルター　ユーザーコメント
  const dayfilteredFirstQestionData = filterDataByTimeFrame(feedbackData);
  
  const dayFilteredStarCount = {};
  dayfilteredFirstQestionData.forEach((item) => {
    if (item.star) {
      dayFilteredStarCount[item.star] = (dayFilteredStarCount[item.star] || 0) + 1;
    }
  });

  const sortedFeedbackData = [...dayfilteredFirstQestionData].sort((a, b) => {
    if (sortConfig.key === "answer_time") {
      const dateA = moment(a.answer_time);
      const dateB = moment(b.answer_time);
      return sortConfig.direction === "ascending" ? dateA.diff(dateB) : dateB.diff(dateA);
    } else if (a[sortConfig.key] < b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? -1 : 1;
    } else if (a[sortConfig.key] > b[sortConfig.key]) {
      return sortConfig.direction === "ascending" ? 1 : -1;
    }
    return 0;
  });

  const handleFilterChange = (event) => {
    const { name, value } = event.target;
    setFilters({ ...filters, [name]: value });
  };

  const filteredFeedbackData = sortedFeedbackData.filter((item) => {
    return Object.keys(filters).every((key) =>
      String(item[key]).toLowerCase().includes(filters[key].toLowerCase())
    );
  });

  // Generate unique colors
  const colors = ["#8884d8", "#82ca9d", "#ff7300", "#ff0000", "#00bfae"];
  const starColors = ["#fdd835", "#fbc02d", "#f9a825", "#f57f17", "#ff6f00"]; // Colors for stars

  if (loading) {
    return (
      <div className="dashboard-layout">
        <MenuBar />
        <div className="dashboard-content">
          <p>データを読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="dashboard-layout">
        <MenuBar />
        <div className="dashboard-content">
          <p className="error-message">{error}</p>
        </div>
      </div>
    );
  }

  if (allData.length === 0) {
    return (
      <div className="dashboard-layout">
        <MenuBar />
        <div className="dashboard-content">
          <h1>アンケート結果</h1>
          <p>まだアンケート結果がありません。</p>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-layout">
    <MenuBar />
    <div className="dashboard-content">
      <div className="dashboard-header">
        <h1>アンケート結果</h1>
      </div>

      {/* 時間範囲のセレクタ */}
      <div className="dashboard-selector">
        <label htmlFor="timeFrameSelect">表示期間: </label>
        <select
          id="timeFrameSelect"
          value={timeFrame}
          onChange={(e) => setTimeFrame(e.target.value)}
          className="dashboard-select"
        >
          {timeFrameOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>

        {timeFrame === "custom" && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
              />
            </>
          )}

      </div>
      
      {/* ▼ 集計単位セレクタを追加 */}
      <div className="dashboard-selector">
        <label htmlFor="aggregationUnitSelect">集計単位: </label>
        <select
          id="aggregationUnitSelect"
          value={aggregationUnit}
          onChange={(e) => setAggregationUnit(e.target.value)}
          className="dashboard-select"
        >
        {aggregationOptions.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}

        </select>
      </div>

        {questions.map((question) => (
          <div key={question.id} className="dashboard-chart-container">
            <h2>{question.text}</h2>

            <div className="dashboard-chart-row">
              {/* Line Chart: Total Answers over Time */}
              <ResponsiveContainer width="100%" height={300}>
              <div className="chart-title">回答数の時系列グラフ</div>
              <LineChart
                // width={400}
                // height={300}
                data={prepareLineChartData(question.id)}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="time"
                  domain={['auto', 'auto']}
                  tickFormatter={(t) =>
                    t === "全体" || t === "Total" ? t : dayjs(t).format("MM/DD")
                  }
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={colors[0]}
                  name="回答数"
                  dot={{ r: 4 }}
                  activeDot={{ r: 8}}
                  isAnimationActive={false}
                />
              </LineChart>
              </ResponsiveContainer>

              {/* Bar Chart: Total Count of Each Answer (Filtered by Time) */}
              <ResponsiveContainer width="100%" height={300}>
              <div className="chart-title">各回答別の総計数グラフ</div>
              <BarChart width={500} height={300} data={aggregateAnswers(question.id)} margin={{ top: 20, right:30, left: 20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="category" dataKey="option" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={colors[0]} name="回答数" />
              </BarChart>
              </ResponsiveContainer>

              {/* Pie Chart: Distribution of Answers (Filtered by Time) */}
              <ResponsiveContainer width="100%" height={300}>
              <div className="chart-title">回答の割合</div>
              <PieChart width={400} height={300}>
                <Pie
                  data={aggregateAnswers(question.id)}
                  dataKey="count"
                  nameKey="option"
                  cx="50%"
                  cy="50%"
                  outerRadius={50}
                  labelLine={true}
                  fontSize={10} 
                  label={(entry) =>
                    `${entry.option}:${(entry.percent * 100).toFixed(0)}%`
                  }
                >
                  {aggregateAnswers(question.id).map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  ))}
                </Pie>
                <Legend />
              </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        ))}

{/*  コメント用Tableと円グラフの表示*/}
<div className="feedback-section">
  <h2>お客様の声</h2>
  <div className="feedback-display" style={{ display: "flex", gap: "16px" }}>
    
    {/* テーブル（左） */}
    <div className="feedback-table-scroll-container" style={{ flex: 1, maxHeight: "400px", overflowY: "auto", border: "1px solid #ccc" }}>
      <table className="feedback-table" style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr>
            <th onClick={() => handleSort("answer_time")}>
              回答日時
              {sortConfig.key === "answer_time" && (
                <span>{sortConfig.direction === "ascending" ? " ▲" : " ▼"}</span>
              )}
            </th>
            <th>コメント</th>
            <th>評価</th>
          </tr>
        </thead>

        <tbody>
          {/* フィルター入力行 */}
          <tr>
            <td></td>
            <td>
              <input
                type="text"
                name="comment"
                value={filters.comment || ""}
                onChange={handleFilterChange}
                placeholder="フィルター"
                style={{
                  width: "100%",
                  height: "24px",
                  fontSize: "12px",
                  padding: "2px 6px",
                  boxSizing: "border-box"
                }}
              />
            </td>
            <td>
              <input
                type="text"
                name="star"
                value={filters.star || ""}
                onChange={handleFilterChange}
                placeholder="フィルター"
                style={{
                  width: "100%",
                  height: "24px",
                  fontSize: "12px",
                  padding: "2px 6px",
                  boxSizing: "border-box"
                }}
              />
            </td>
          </tr>

          {/* フィードバック行 */}
          {filteredFeedbackData.map((item, index) => {
            const comment = item.comment || "---";
            const star = item.star || "---";

            if (comment === "---" && star === "---") {
              return null;
            }

            return (
              <tr key={`feedback-${index}`}>
                <td>{moment(item.answer_time).format("YYYY-MM-DD HH:mm")}</td>
                <td>{comment}</td>
                <td>{star}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>

    {/* チャート（右） */}
    {Object.keys(dayFilteredStarCount).length > 0 && (
      <div className="star-pie-chart" style={{ width: "300px", flexShrink: 0 }}>
        <ResponsiveContainer width="100%" height={300}>
        <div className="chart-title">回答の割合</div>
          <PieChart>
            <Pie
              data={Object.entries(dayFilteredStarCount).map(([star, count]) => ({
                star,
                count,
              }))}
              dataKey="count"
              nameKey="star"
              cx="50%"
              cy="40%"
              outerRadius={50}
              innerRadius={0}
              label={(entry) => `${entry.star}★(${(entry.percent * 100).toFixed(1)}%)`}
            >
              {Object.keys(dayFilteredStarCount).map((star, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={starColors[parseInt(star) - 1] || "#ccc"}
                />
              ))}
            </Pie>
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    )}

  </div>
</div>


{/* 
<div className="feedback-section">
  <h2>アンケート回答総合計数</h2>
  <div className="feedback-display" style={{ display: "flex", gap: "16px" }}>
    
  </div>
</div> */}


      </div>
    </div>
  );
};

export default Dashboard;