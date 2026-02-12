T = int(input())

for tc in range(1, T+1):
    N, W1, W2 = map(int, input().split())
    weight = list(map(int, input().split()))    # 화물 무게 리스트 입력

    # 무거운 화물부터 사용해야 최소 비용이 되므로 내림차순 정렬
    weight.sort(reverse=True)

    total = 0   # 총 비용
    idx = 0     # 현재 사용 중인 화물의 인덱스

    # 1층부터 가장 높은 층(max(W1, W2))까지 반복
    for i in range(1, max(W1, W2) + 1):     

        if i <= W1:     # 만약 현재 층(i)이 탑1에 존재한다면?
            total += weight[idx] * i    # 가장 무거운 남은 화물을 현재 층에 배정
            idx += 1

        if i <= W2:     # 만약 현재 층(i)이 탑2에 존재한다면?
            total += weight[idx] * i    # 다음으로 무거운 화물을 현재 층에 배정
            idx += 1
    
    print(f'#{tc} {total}')

'''
알고리즘 해결 흐름

1. 화물을 내림차순 정렬
    > 5 4 3 2 1
2. 1층부터 가장 높은 층까지 차례대로 올라간다
3. 현재 층이 존재하는 탑마다 화물을 하나씩 배정한다
4. 배정할 때마다 화물 무게 x 층 번호를 누적해서 총 비용을 계산한다

'''
