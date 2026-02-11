T = int(input())

for tc in range(1, T + 1):
    N = int(input())    # N개의 당근
    arr = sorted(list(map(int, input().split())))

    # N 최대가 1000 이므로...
    result = 1001

    # 소, 중 나누는 기준점 i
    # 중, 대 나누는 기준점 j
    for i in range(1, N-1):
        for j in range(i+1, N):
            # 자 이제 모든 경우의 수 갑니다. 그런데 그 중에
            # 경계선에 있는 당근들 크기 같으면 리스트를 만들지 않고 다음 경우의 수로 넘어가요... (continue)
            if arr[i-1] == arr[i] or arr[j-1] == arr[j]:
                continue
            
            # 뭔가 이 부분을 줄일 수 있을 것 같은데 잘 모르겠습니다.
            s_arr = arr[:i]
            m_arr = arr[i:j]
            l_arr = arr[j:]

            s_count = len(s_arr)
            m_count = len(m_arr)
            l_count = len(l_arr)

            # 한 상자에 당근이 N//2개 초과하는지 검사
            if max(s_count, m_count, l_count) <= N//2:
                # 검사 통과한 것들 diff 계산
                diff = max(s_count, m_count, l_count) - min(s_count, m_count, l_count)
                # 아래 if문으로 최솟값 업데이트
                if diff < result:
                    result = diff

    # 업데이트 안 되고 result가 그대로 1001이면?
    if result == 1001:
        result = -1

    print(f'#{tc} {result}')



    # 처음에 아래와 같이 시도하다가 막막해서 버렸습니다.
    # set_C_arr = list(set(C_arr))
    # j = (N//3)*2
    # s_arr = set_C_arr[:N//3]
    # m_arr = set_C_arr[N//3:j+1]
    # l_arr = set_C_arr[j:]

    