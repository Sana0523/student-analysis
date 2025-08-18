// LeetCode 85: Maximal Rectangle
// Problem: https://leetcode.com/problems/maximal-rectangle/
// Given a 2D binary matrix filled with 0's and 1's, find the largest rectangle containing only 1's and return its area.
// The solution builds on the concept of the largest rectangle in a histogram. It first constructs a prefix sum matrix where each cell contains the height of consecutive '1's up to that point. Then, it applies the largest rectangle area calculation for each row of this prefix sum matrix, treating each row as a histogram.

class Solution {
public:
    int maxhist(vector<int>& heights)
    {
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

    int maximalRectangle(vector<vector<char>>& matrix) {
        int m=matrix.size();
        int n=matrix[0].size();
        int maxarea=0;
        vector<vector<int>> prefix_sum(m,vector<int>(n,0));
        for(int i=0;i<m;i++)
        {
            for(int j=0;j<n;j++)
            {
                if(matrix[i][j]=='1')
                    prefix_sum[i][j]+=(i==0)?1:prefix_sum[i-1][j]+1;
                else
                    prefix_sum[i][j]=0;
            }
        }
        for(int i=0;i<m;i++)
            maxarea=max(maxarea,maxhist(prefix_sum[i]));
        return maxarea;
    }
};