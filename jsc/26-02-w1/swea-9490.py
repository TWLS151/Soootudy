import sys


arr = list(map,list(map(int, input().split())))


def = arr[i][j]

# 이차원 리스트를 만들어서 해당값을 구함
for i in a:
    for j in b:
        k = arr[i][j]
        for plus in k:
            sum += arr[i+plus][j]
            sum += arr[i-plus][j]
        for plus in k:
            sum += arr[i][j+plus]
            sum += arr[i][j-plus]
    sum += arr[i][j]  
    
    # 모든 위치를 돌아가면서 최댓값 갱신


