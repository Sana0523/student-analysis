// Problem: https://leetcode.com/problems/largest-rectangle-in-histogram/
// LeetCode 84. Largest Rectangle in Histogram
// Given an array of integers heights representing the histogram's bar height where the width of each bar is 1, return the area of the largest rectangle that can be formed in the histogram.
// The solution uses a stack to maintain the indices of the histogram bars, ensuring that the heights are in non-decreasing order. When a bar is found that is shorter than the bar at the index stored at the top of the stack, it calculates the area of the rectangle formed with the height of the bar at that index and updates the maximum area found so far.
// The algorithm iterates through each bar in the histogram, and for each bar, it checks if the current height is less than the height of the bar at the index stored at the top of the stack. If it is, it pops the stack and calculates the area of the rectangle formed with that height. After processing all bars, it ensures to pop any remaining indices in the stack to calculate any remaining areas.

class Solution {
public:
    int largestRectangleArea(vector<int>& heights) {
        stack <int> st;
        int maxarea=INT_MIN,i;
        int n=heights.size();
        for(i=0;i<n;i++)
        {
            while(!st.empty() && heights[i]<heights[st.top()])
            {
                int e=st.top();
                st.pop();
                int nse=i;
                int pse=st.empty()?-1:st.top();
                maxarea=max((heights[e]*(nse-pse-1)),maxarea);
            }
            st.push(i);
        }
        while(!st.empty())
            {
                int e=st.top();
                st.pop();
                int nse=n;
                int pse=st.empty()?-1:st.top();
                maxarea=max(heights[e]*(nse-pse-1),maxarea);
            }
        return maxarea;
    }
};