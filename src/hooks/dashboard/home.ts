import { useMemo } from 'react';
import { useWindowDimensions } from 'react-native';

export function useChartConfigs() {
  const { width: windowWidth } = useWindowDimensions();

  const getChartHeight = (small: number, medium: number, large: number) => {
    if (windowWidth < 380) {
      return small;
    }

    if (windowWidth < 768) {
      return medium;
    }

    return large;
  };

  const getPieChartHeight = () => getChartHeight(230, 260, 320);

  const paymentChartSeries = useMemo(() => [42, 55, 48, 63, 71, 68], []);
  const employeeChartSeries = useMemo(() => [88, 74, 92, 69, 81], []);
  const pieChartSeries = useMemo(() => [44, 31, 25], []);

  const paymentChartOptions = useMemo(
    () => ({
      labels: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
      title: 'Payment Dynamics',
    }),
    []
  );

  const employeeChartOptions = useMemo(
    () => ({
      labels: ['Aylin', 'Rashad', 'Nigar', 'Murad', 'Leyla'],
      title: 'Employee Performance',
    }),
    []
  );

  const pieChartOptions = useMemo(
    () => ({
      labels: ['Pending', 'In Progress', 'Closed'],
      title: 'Application Status',
    }),
    []
  );

  return {
    getChartHeight,
    getPieChartHeight,
    paymentChartOptions,
    paymentChartSeries,
    employeeChartOptions,
    employeeChartSeries,
    pieChartOptions,
    pieChartSeries,
    windowWidth,
  };
}
