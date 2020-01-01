import React from 'react';
import PropTypes from 'prop-types';
import { FaAngleLeft, FaAngleRight } from 'react-icons/fa';
import { Link } from 'react-router-dom';
import api from '../../services/api';

import Container from '../../components/Container';

import {
  Loading,
  Owner,
  IssueFilter,
  IssueList,
  ButtonFilter,
  Page,
} from './style';

export default class Repository extends React.Component {
  static propTypes = {
    match: PropTypes.shape({
      params: PropTypes.shape({
        repository: PropTypes.string,
      }),
    }).isRequired,
  };

  state = {
    repository: {},
    issues: [],
    loading: true,
    filterItem: [
      { name: 'open', active: true },
      { name: 'closed', active: false },
      { name: 'all', active: false },
    ],
    filterIndex: null,
    page: 1,
  };

  async componentDidMount() {
    const { match } = this.props;
    const { filterItem } = this.state;

    const repoName = decodeURIComponent(match.params.repository);
    const state = filterItem.find(item => item.active).name;
    const index = filterItem.findIndex(item => item.active);
    const [repository, issues] = await Promise.all([
      api.get(`/repos/${repoName}`),
      api.get(`repos/${repoName}/issues`, {
        params: {
          state,
          per_page: 5,
          page: 1,
        },
      }),
    ]);

    this.setState({
      filterIndex: index,
      repository: repository.data,
      issues: issues.data,
      loading: false,
    });
  }

  handleFilter = async index => {
    const { match } = this.props;
    const { filterItem, page } = this.state;

    const repoName = decodeURIComponent(match.params.repository);
    const issues = await api.get(`repos/${repoName}/issues`, {
      params: {
        state: filterItem[index].name,
        per_page: 5,
        page,
      },
    });

    this.setState(prevState => ({
      filterIndex: index,
      issues: issues.data,
      // Como atualizar um array de objetos
      filterItem: prevState.filterItem.map(item =>
        item.name === filterItem[index].name
          ? {
              ...item,
              active: true,
            }
          : {
              ...item,
              active: false,
            }
      ),
    }));
  };

  handleNext = () => {
    const { page, filterIndex } = this.state;
    this.setState({ page: page + 1 }, () => this.handleFilter(filterIndex));
  };

  handlePrev = () => {
    const { page, filterIndex } = this.state;
    if (page !== 1) {
      this.setState({
        page: page - 1,
      });
    }
  };

  render() {
    const { repository, issues, loading, filterItem, page } = this.state;

    if (loading) {
      return <Loading>Carregando</Loading>;
    }
    return (
      <Container>
        <Owner>
          <Link to="/">Voltar aos repositórios</Link>
          <img src={repository.owner.avatar_url} alt={repository.owner.login} />
          <h1>{repository.name}</h1>
          <p>{repository.description}</p>
        </Owner>

        <IssueList>
          <IssueFilter>
            {filterItem.map((item, index) => (
              <ButtonFilter
                type="button"
                key={item.name}
                onClick={() => this.handleFilter(index)}
                active={item.active ? 1 : 0}
              >
                {item.name}
              </ButtonFilter>
            ))}
          </IssueFilter>

          {issues.map(issue => (
            <li key={String(issue.id)}>
              <img src={issue.user.avatar_url} alt={issue.user.login} />
              <div>
                <strong>
                  <a href={issue.html_url}> {issue.title}</a>
                  {issue.labels.map(label => (
                    <span key={String(label.id)}>{label.name}</span>
                  ))}
                </strong>
                <p>{issue.user.login}</p>
              </div>
            </li>
          ))}
        </IssueList>

        <Page>
          <FaAngleLeft onClick={this.handlePrev} cursor="pointer" />
          <p>{page}</p>
          <FaAngleRight onClick={this.handleNext} cursor="pointer" />
        </Page>
      </Container>
    );
  }
}
