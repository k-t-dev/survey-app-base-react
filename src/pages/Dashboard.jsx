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
} from "recharts";
import "./Dashboard.css";
import MenuBar from "./MenuBar"; // MenuBar コンポーネントをインポート
import moment from "moment"; // Moment.js for easier date manipulation

const Dashboard = () => {
  const { companyId, shopId } = useParams();

  console.log("shopId in DashBoard", shopId);

  const [timeFrame, setTimeFrame] = useState("month");
  const [customStartDate, setCustomStartDate] = useState("");
  const [customEndDate, setCustomEndDate] = useState("");

  const [allData, setAllData] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true); // ローディング状態を追加
  const [error, setError] = useState(null); // エラー状態を追加
  const [feedbackData, setFeedbackData] = useState([]); // first_questionがtrueのデータを格納
  const [starCounts, setStarCounts] = useState({}); // Starの数をカウント
  const [sortConfig, setSortConfig] = useState({ key: "answer_time", direction: "descending" }); // 初期ソート設定
  const [filters, setFilters] = useState({}); // フィルターの状態

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true); // データ取得開始時にローディングをtrueに
      setError(null); // エラー状態をリセット
      try {
        const response = await fetch(
          `https://dyhbv4khoh.execute-api.ap-northeast-1.amazonaws.com/dev/survey-results/${companyId}/${shopId}`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }
        );

        console.log("response", response);

        if (response.ok) {
          const data = await response.json();
          console.log("Fetched Data:", data);
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
          setFeedbackData(feedback);

          // Count the occurrences of each star rating
          const stars = {};
          feedback.forEach((item) => {
            if (item.star) {
              stars[item.star] = (stars[item.star] || 0) + 1;
            }
          });
          setStarCounts(stars);
        } else if (response.status === 404) {
          // データが存在しない場合
          setAllData([]);
          setQuestions([]);
          setFeedbackData([]);
          setStarCounts({});
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

  const timeFrameOptions = [
    { value: "3days", label: "📅 過去3日" },
    { value: "week", label: "📅 1週間" },
    { value: "month", label: "📅 1か月" },
    { value: "3months", label: "📅 3か月" },
    { value: "custom", label: "📅 期間指定" },
    { value: "all", label: "📅 全期間" },
  ];

  const filterDataByTimeFrame = () => {
    let filteredData = allData;
    const now = moment();

    switch (timeFrame) {
      case "3days":
        filteredData = allData.filter(
          (item) => now.diff(moment(item.answer_time), "days") < 3
        );
        break;
      case "week":
        filteredData = allData.filter(
          (item) => now.diff(moment(item.answer_time), "weeks") < 1
        );
        break;
      case "month":
        filteredData = allData.filter(
          (item) => now.diff(moment(item.answer_time), "months") < 1
        );
        break;
      case "3months":
        filteredData = allData.filter(
          (item) => now.diff(moment(item.answer_time), "months") < 3
        );
        break;
      case "custom":
        const start = moment(customStartDate);
        const end = moment(customEndDate);
        filteredData = allData.filter(
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

  const aggregateAnswers = (questionId) => {
    const filteredData = filterDataByTimeFrame().filter(
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

  const prepareLineChartData = (questionId) => {
    const filteredData = filterDataByTimeFrame().filter(
      (item) => item.question_id === questionId
    );
    const timeGrouped = {};
    filteredData.forEach((item) => {
      const date = moment(item.answer_time).format("YYYY-MM-DD"); // Group by day
      timeGrouped[date] = (timeGrouped[date] || 0) + 1;
    });
    return Object.entries(timeGrouped)
      .sort((a, b) => new Date(a[0]) - new Date(b[0])) // Sort by date
      .map(([time, count]) => ({ time, count }));
  };

  const handleSort = (key) => {
    let direction = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const sortedFeedbackData = [...feedbackData].sort((a, b) => {
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
          <h1> アンケート結果</h1>
        </div>

        <div className="dashboard-selector">
          <label htmlFor="timeFrameSelect">表示単位: </label>
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

        {questions.map((question) => (
          <div key={question.id} className="dashboard-chart-container">
            <h2>{question.text}</h2>

            <div className="dashboard-chart-row">
              {/* Line Chart: Total Answers over Time */}
              <div className="chart-title">回答数の時系列グラフ</div>
              <LineChart width={400} height={300} data={prepareLineChartData(question.id)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke={colors[0]}
                  name="回答数"
                />
              </LineChart>

              {/* Bar Chart: Total Count of Each Answer (Filtered by Time) */}
              <div className="chart-title">各回答別の総計数グラフ</div>
              <BarChart width={400} height={300} data={aggregateAnswers(question.id)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="category" dataKey="option" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill={colors[0]} name="回答数" />
              </BarChart>

              {/* Pie Chart: Distribution of Answers (Filtered by Time) */}
              <div className="chart-title">回答の割合</div>
              <PieChart width={400} height={300}>
                <Pie
                  data={aggregateAnswers(question.id)}
                  dataKey="count"
                  nameKey="option"
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  label={(entry) =>
                    `${entry.option}: ${(entry.percent * 100).toFixed(0)}%`
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
            </div>
          </div>
        ))}

        {/* Feedback Table with Sorting and Filtering */}
        {feedbackData.length > 0 && (
          <div className="feedback-section">
            <h2>お客様の声</h2>
            <div className="feedback-display">
              <div className="feedback-table-container">
                <table className="feedback-table">
                  <thead>
                    <tr>
                      <th onClick={() => handleSort("answer_time")}>
                        回答日時
                        {sortConfig.key === "answer_time" && (
                          <span>{sortConfig.direction === "ascending" ? " ▲" : " ▼"}</span>
                        )}
                      </th>
                      <th>
                        コメント
                        <input
                          type="text"
                          name="comment"
                          value={filters.comment || ""}
                          onChange={handleFilterChange}
                          placeholder="フィルター"
                        />
                      </th>
                      <th>
                        評価
                        <input
                          type="text"
                          name="star"
                          value={filters.star || ""}
                          onChange={handleFilterChange}
                          placeholder="フィルター"
                        />
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                  {filteredFeedbackData.map((item, index) => {
                    const comment = item.comment || "---";
                    const star = item.star || "---";

                    // 両方とも "---" の場合は何も表示しない
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

              {Object.keys(starCounts).length > 0 && (
                <div className="star-pie-chart">
                  <h3>評価分布</h3>
                  <PieChart width={500} height={300}>
                    <Pie
                      data={Object.entries(starCounts).map(([star, count]) => ({
                        star,
                        count,
                      }))}
                      dataKey="count"
                      nameKey="star"
                      cx="50%"
                      cy="50%"
                      outerRadius={60}
                      innerRadius={0} 
                      label={(entry) => `${entry.star}★(${(entry.percent * 100).toFixed(1)}%)`}
                    >
                      {Object.keys(starCounts).map((star, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={starColors[parseInt(star) - 1] || "#ccc"} // Use star-specific colors
                        />
                      ))}
                    </Pie>
                    <Legend />
                  </PieChart>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;