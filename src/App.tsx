import React, { useState } from "react";
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
} from "recharts";

const AppContainer = styled.div`
  max-width: 1200px;
  margin: 0 auto;
  padding: 20px;
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

interface ESGProfile {
  company_name: string;
  industry: string;
  description: string;
  annual_emissions: number;
  carbon_reduction_goal: number;
  preferred_project_types: string;
  preferred_locations: string;
  sdgs: string;
  environmental_focus: string;
  social_focus: string;
  technology_interests: string;
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

function App() {
  const [formData, setFormData] = useState<ESGProfile>({
    company_name: "",
    industry: "",
    description: "",
    annual_emissions: 0,
    carbon_reduction_goal: 0,
    preferred_project_types: "",
    preferred_locations: "",
    sdgs: "",
    environmental_focus: "",
    social_focus: "",
    technology_interests: "",
  });

  const [results, setResults] = useState<MatchResponse | null>(null);

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
    try {
      const response = await axios.post<MatchResponse>(
        "http://your-ec2-ip:8000/api/v1/match_opportunities",
        formData
      );
      setResults(response.data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <AppContainer>
      <h1>Carbon Credit Matcher</h1>
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
          </SummaryContainer>

          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={results.matches}>
              <XAxis dataKey="opportunity.name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="match_score" fill="#8884d8" name="Match Score" />
              <Bar
                dataKey="opportunity.annual_co2_reduction"
                fill="#82ca9d"
                name="Annual CO2 Reduction"
              />
            </BarChart>
          </ResponsiveContainer>

          <MatchesContainer>
            {results.matches.map((match, index) => (
              <MatchCard key={index}>
                <h3>{match.opportunity.name}</h3>
                <p>Match Score: {match.match_score.toFixed(2)}</p>
                <p>Project Type: {match.opportunity.project_type}</p>
                <p>Location: {match.opportunity.location}</p>

                <Section>
                  <SectionTitle>Description</SectionTitle>
                  <p>{match.opportunity.description}</p>
                </Section>

                <Section>
                  <SectionTitle>SDGs</SectionTitle>
                  <ul>
                    {match.opportunity.sdgs.map((sdg, i) => (
                      <ListItem key={i}>SDG {sdg}</ListItem>
                    ))}
                  </ul>
                </Section>

                <Section>
                  <SectionTitle>Environmental Impact</SectionTitle>
                  <p>{match.opportunity.environmental_impact}</p>
                </Section>

                <Section>
                  <SectionTitle>Social Impact</SectionTitle>
                  <p>{match.opportunity.social_impact}</p>
                </Section>

                <Section>
                  <SectionTitle>CO2 Reduction</SectionTitle>
                  <p>Annual: {match.opportunity.annual_co2_reduction} tons</p>
                  <p>Total: {match.opportunity.total_co2_reduction} tons</p>
                </Section>

                <Section>
                  <SectionTitle>Project Duration</SectionTitle>
                  <p>{match.opportunity.project_duration} years</p>
                </Section>

                <Section>
                  <SectionTitle>Co-benefits</SectionTitle>
                  <ul>
                    {match.opportunity.co_benefits.map((benefit, i) => (
                      <ListItem key={i}>{benefit}</ListItem>
                    ))}
                  </ul>
                </Section>

                <Section>
                  <SectionTitle>Technology Used</SectionTitle>
                  <p>{match.opportunity.technology_used}</p>
                </Section>

                <Section>
                  <SectionTitle>Match Explanation</SectionTitle>
                  <p>{match.match_explanation}</p>
                </Section>
              </MatchCard>
            ))}
          </MatchesContainer>
        </ResultsContainer>
      )}
    </AppContainer>
  );
}

export default App;
