import React, { useState, useEffect } from "react";
import styled from "styled-components";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LabelList,
} from "recharts";
import MatchExplanation from "./ExplanationContainer";

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{`${payload[0].payload.opportunity.name}`}</p>
        <p className="intro">{`${payload[0].name} : ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
`;

const TabContainer = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
`;

const TabButton = styled.button<{ active: boolean }>`
  padding: 10px 20px;
  border: none;
  background-color: ${(props) => (props.active ? "#007bff" : "#f0f0f0")};
  color: ${(props) => (props.active ? "white" : "black")};
  cursor: pointer;
  transition: background-color 0.3s;

  &:hover {
    background-color: ${(props) => (props.active ? "#0056b3" : "#e0e0e0")};
  }
`;

const DefaultDataButton = styled.button`
  padding: 10px;
  background-color: #28a745;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-bottom: 10px;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
`;

const Input = styled.input`
  padding: 10px;
  border: 1px solid #ccc;
  border-radius: 4px;
`;

const Button = styled.button`
  padding: 10px;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
`;

const ResultsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const SummaryContainer = styled.div`
  background-color: #f0f0f0;
  padding: 15px;
  border-radius: 4px;
`;

const MatchesContainer = styled.div`
  display: flex;
  flex-direction: column;
  flex-wrap: wrap;
  gap: 20px;
`;

const MatchCard = styled.div`
  flex: 1 1 300px;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 15px;
  max-height: 500px;
  overflow-y: auto;
`;

const Section = styled.div`
  margin-bottom: 10px;
`;

const SectionTitle = styled.h3`
  margin-bottom: 5px;
`;

const ListItem = styled.li`
  margin-bottom: 5px;
`;

// interface ESGProfile {
//   company_name: string;
//   industry: string;
//   description: string;
//   annual_emissions: number;
//   carbon_reduction_goal: number;
//   preferred_project_types: string;
//   preferred_locations: string;
//   sdgs: string;
//   environmental_focus: string;
//   social_focus: string;
//   technology_interests: string;
// }

interface ESGProfile {
  company_name: string;
  industry: string;
  description: string;
  annual_emissions: number;
  carbon_reduction_goal: number;
  preferred_project_types: string[];
  preferred_locations: string[];
  sdgs: number[];
  environmental_focus: string;
  social_focus: string;
  technology_interests: string[];
}

interface CarbonCreditOpportunity {
  id: number;
  name: string;
  project_type: string;
  location: string;
  description: string;
  detailed_explanation: string;
  sdgs: number[];
  environmental_impact: string;
  social_impact: string;
  annual_co2_reduction: number;
  total_co2_reduction: number;
  project_duration: number;
  co_benefits: string[];
  technology_used: string;
}

interface MatchResult {
  opportunity: CarbonCreditOpportunity;
  match_explanation: string;
  short_summary: string;
  match_score: number;
}

interface MatchResponse {
  matches: MatchResult[];
  summary: {
    average_score: number;
    median_score: number;
    best_score: number;
    average_co2_reduction: number;
    total_co2_reduction: number;
    number_of_matches: number;
  };
}

const SpinnerOverlay = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 1000;
`;

const SpinnerText = styled.p`
  color: white;
  margin-top: 10px;
`;

const Spinner = styled.div`
  border: 4px solid #f3f3f3;
  border-top: 4px solid #3498db;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;
  margin: 20px auto;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000";

const formatExplanation = (explanation: string): JSX.Element[] => {
  const sections = explanation.split(/\d+\.\s+\*\*/);
  return sections
    .map((section, index) => {
      if (index === 0) return null; // Skip the introductory text
      const [title, content] = section.split("**: ");
      return (
        <div key={index}>
          <h4>{title}</h4>
          <p>{content}</p>
        </div>
      );
    })
    .filter((element): element is JSX.Element => element !== null);
};

function App() {
  const [formData, setFormData] = useState<ESGProfile>({
    company_name: "",
    industry: "",
    description: "",
    annual_emissions: 0,
    carbon_reduction_goal: 0,
    preferred_project_types: [],
    preferred_locations: [],
    sdgs: [],
    environmental_focus: "",
    social_focus: "",
    technology_interests: [],
  });
  const [isLoading, setIsLoading] = useState(false);
  const [chartMode, setChartMode] = useState("score");
  const [activeTab, setActiveTab] = useState(0);

  const [results, setResults] = useState<MatchResponse | null>(null);

  useEffect(() => {
    if (results) {
      console.log("Received results:", results);
      results.matches.forEach((match, index) => {
        console.log(`Match ${index + 1}:`, {
          name: match.opportunity.name,
          match_explanation: match.match_explanation,
          short_summary: match.short_summary,
          match_score: match.match_score,
        });
      });
    }
  }, [results]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        name === "annual_emissions" || name === "carbon_reduction_goal"
          ? parseFloat(value)
          : value,
    }));
  };
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await axios.post<MatchResponse>(
        `${API_URL}/api/v1/match_opportunities`,
        formData
      );
      setResults(response.data);
    } catch (error) {
      console.error("Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const fillDefaultData = () => {
    setFormData({
      company_name: "EcoTech Solutions",
      industry: "Renewable Energies",
      description:
        "EcoTech Solutions is a leading innovator in renewable energy technologies, focusing on solar and wind power solutions for urban environments.",
      annual_emissions: 50000,
      carbon_reduction_goal: 30,
      preferred_project_types: [
        "Solar Energy",
        "Wind Energy",
        "Energy Efficiency",
      ],
      preferred_locations: ["United States", "Europe"],
      sdgs: [7, 9, 11, 13],
      environmental_focus:
        "Reducing carbon emissions and promoting clean energy adoption in cities",
      social_focus:
        "Creating green jobs and improving air quality in urban areas",
      technology_interests: [
        "Photovoltaic cells",
        "Wind turbines",
        "Smart grid technologies",
      ],
    });
  };

  const chartData = (results: MatchResponse) =>
    results.matches.map((match) => ({
      ...match,
      match_score: match.match_score * 100,
    }));

  return (
    <AppContainer>
      {isLoading && (
        <SpinnerOverlay>
          <Spinner />
          <SpinnerText>
            This is NOT optimized and may take a few minutes...
          </SpinnerText>
        </SpinnerOverlay>
      )}
      <h1>Carbon Credit Matcher</h1>
      <h4>
        Note: This is a POC of using AI to match an ESG profile (inputed through
        fields by the user) with a collection of carbon credit opportunities
        with the goal of generating a "top 3" carbon offset project
        opportunities. The AI model will generate matching explanations in the
        form of a short summary and then longer explanations based on various
        profile considerations. Scores will also be generated.
      </h4>
      <h4>
        The collection is a naive collection of three (3) opportunities taken
        from a database of projects.
      </h4>
      <DefaultDataButton onClick={fillDefaultData}>
        Fill with Example Data
      </DefaultDataButton>
      <Form onSubmit={handleSubmit}>
        {Object.entries(formData).map(([key, value]) => (
          <Input
            key={key}
            type={
              key.includes("emissions") || key.includes("goal")
                ? "number"
                : "text"
            }
            name={key}
            placeholder={key.replace(/_/g, " ")}
            value={value}
            onChange={handleChange}
          />
        ))}
        <Button type="submit">Find Matches</Button>
      </Form>

      {results && (
        <ResultsContainer>
          <SummaryContainer>
            <h3>Match Summary</h3>
            <p>
              Average Match Score:{" "}
              {(results.summary.average_score * 100).toFixed(2)}%
            </p>
            <p>
              Best Match: {results.matches[0].opportunity.name} with{" "}
              {(results.summary.best_score * 100).toFixed(2)}%
            </p>
            <p>
              Total Potential CO2 Reduction:{" "}
              {results.summary.total_co2_reduction.toFixed(2)} tons/year
            </p>
          </SummaryContainer>
          {/* <SummaryContainer>
            <h2>Summary</h2>
            <p>Average Score: {results.summary.average_score.toFixed(2)}</p>
            <p>Median Score: {results.summary.median_score.toFixed(2)}</p>
            <p>Best Score: {results.summary.best_score.toFixed(2)}</p>
            <p>
              Average CO2 Reduction:{" "}
              {results.summary.average_co2_reduction.toFixed(2)} tons/year
            </p>
            <p>
              Total CO2 Reduction:{" "}
              {results.summary.total_co2_reduction.toFixed(2)} tons/year
            </p>
            <p>Number of Matches: {results.summary.number_of_matches}</p>
          </SummaryContainer> */}

          <div>
            <button onClick={() => setChartMode("score")}>
              Show Match Scores
            </button>
            <button onClick={() => setChartMode("reduction")}>
              Show CO2 Reduction
            </button>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={chartData(results)}>
              <XAxis dataKey="opportunity.name" />
              {chartMode === "score" ? (
                <Bar
                  dataKey="match_score"
                  fill="#8884d8"
                  name="Match Score (%)"
                  yAxisId="score"
                >
                  <LabelList dataKey="opportunity.name" position="top" />
                </Bar>
              ) : (
                <Bar
                  dataKey="opportunity.annual_co2_reduction"
                  fill="#82ca9d"
                  name="Annual CO2 Reduction (tons)"
                  yAxisId="reduction"
                >
                  <LabelList dataKey="opportunity.name" position="top" />
                </Bar>
              )}
              <Tooltip content={<CustomTooltip />} />
              <Legend />
              <YAxis yAxisId="score" orientation="left" domain={[0, 100]} />
              <YAxis yAxisId="reduction" orientation="right" />
            </BarChart>
          </ResponsiveContainer>

          <MatchesContainer>
            <TabContainer>
              {results.matches.map((match, index) => (
                <TabButton
                  key={index}
                  active={activeTab === index}
                  onClick={() => setActiveTab(index)}
                >
                  {match.opportunity.name}
                </TabButton>
              ))}
            </TabContainer>

            <MatchCard>
              <h3>{results.matches[activeTab].opportunity.name}</h3>
              <p>
                Match Score:{" "}
                {(results.matches[activeTab].match_score * 100).toFixed(2)}%
              </p>
              <p>
                Project Type:{" "}
                {results.matches[activeTab].opportunity.project_type}
              </p>
              <p>Location: {results.matches[activeTab].opportunity.location}</p>

              <Section>
                <SectionTitle>Description</SectionTitle>
                <p>{results.matches[activeTab].opportunity.description}</p>
              </Section>

              <Section>
                <SectionTitle>Short Match Summary</SectionTitle>
                <p>{results.matches[activeTab].short_summary}</p>
              </Section>

              <Section>
                <SectionTitle>Match Explanation</SectionTitle>
                <MatchExplanation
                  explanation={results.matches[activeTab].match_explanation}
                />
              </Section>

              <Section>
                <SectionTitle>SDGs</SectionTitle>
                <ul>
                  {results.matches[activeTab].opportunity.sdgs.map((sdg, i) => (
                    <ListItem key={i}>SDG {sdg}</ListItem>
                  ))}
                </ul>
              </Section>

              <Section>
                <SectionTitle>Environmental Impact</SectionTitle>
                <p>
                  {results.matches[activeTab].opportunity.environmental_impact}
                </p>
              </Section>

              <Section>
                <SectionTitle>Social Impact</SectionTitle>
                <p>{results.matches[activeTab].opportunity.social_impact}</p>
              </Section>

              <Section>
                <SectionTitle>CO2 Reduction</SectionTitle>
                <p>
                  Annual:{" "}
                  {results.matches[activeTab].opportunity.annual_co2_reduction}{" "}
                  tons
                </p>
                <p>
                  Total:{" "}
                  {results.matches[activeTab].opportunity.total_co2_reduction}{" "}
                  tons
                </p>
              </Section>

              <Section>
                <SectionTitle>Project Duration</SectionTitle>
                <p>
                  {results.matches[activeTab].opportunity.project_duration}{" "}
                  years
                </p>
              </Section>

              <Section>
                <SectionTitle>Co-benefits</SectionTitle>
                <ul>
                  {results.matches[activeTab].opportunity.co_benefits.map(
                    (benefit, i) => (
                      <ListItem key={i}>{benefit}</ListItem>
                    )
                  )}
                </ul>
              </Section>

              <Section>
                <SectionTitle>Technology Used</SectionTitle>
                <p>{results.matches[activeTab].opportunity.technology_used}</p>
              </Section>
            </MatchCard>
          </MatchesContainer>
        </ResultsContainer>
      )}
    </AppContainer>
  );
}

export default App;
